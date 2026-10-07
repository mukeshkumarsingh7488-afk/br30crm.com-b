const mongoose = require("mongoose");
const Subscription = require("./subscription.model");
const Payment = require("./payment.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");
const paytm = require("./paytm.service");
const PLANS = { FREE: { monthly: 0, yearly: 0 }, STARTER: { monthly: 499, yearly: 4990 }, GROWTH: { monthly: 999, yearly: 9990 }, PRO: { monthly: 1999, yearly: 19990 }, ENTERPRISE: { monthly: 4999, yearly: 49990 } };
const ensure = async (businessId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) throw new ApiError(400, "Invalid business ID");
  const b = await Business.findOne({ _id: businessId, status: "ACTIVE" }).select("_id").lean();
  if (!b) throw new ApiError(404, "Active business not found");
  const m = await BusinessMember.exists({ businessId, userId, status: "ACTIVE" });
  if (!m) throw new ApiError(403, "You are not an active member of this business");
};
exports.plans = async () => Object.entries(PLANS).map(([id, v]) => ({ id, name: id, monthly: v.monthly, yearly: v.yearly, currency: "INR" }));
exports.current = async ({ businessId, userId }) => {
  await ensure(businessId, userId);
  let s = await Subscription.findOne({ businessId, status: { $in: ["TRIALING", "ACTIVE", "PAST_DUE"] } })
    .sort({ createdAt: -1 })
    .lean();
  if (!s) {
    s = await Subscription.create({ businessId, plan: "FREE", status: "ACTIVE", billingCycle: "MONTHLY", amount: 0, currency: "INR", createdBy: userId, updatedBy: userId });
    s = s.toObject();
  }
  return s;
};
exports.checkout = async ({ businessId, userId, plan, billingCycle }) => {
  await ensure(businessId, userId);
  if (!PLANS[plan]) throw new ApiError(400, "Invalid plan");
  const cycle = billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY";
  const amount = PLANS[plan][cycle.toLowerCase()];
  if (amount <= 0) return { free: true, plan };
  const subscription = await Subscription.create({ businessId, plan, status: "TRIALING", billingCycle: cycle, amount, currency: "INR", provider: "PAYTM", createdBy: userId, updatedBy: userId });
  const orderId = `BR30_${Date.now()}_${cryptoSafe()}`;
  const payment = await Payment.create({ businessId, subscriptionId: subscription._id, orderId, amount, currency: "INR", provider: "PAYTM", createdBy: userId });
  try {
    const txn = await paytm.initiate({ orderId, customerId: userId, amount });
    return { paymentId: payment._id, subscriptionId: subscription._id, orderId, ...txn };
  } catch (e) {
    payment.status = "FAILED";
    payment.providerResponse = { message: e.message };
    await payment.save();
    throw new ApiError(502, e.message);
  }
};
const cryptoSafe = () => Math.random().toString(36).slice(2, 10).toUpperCase();
exports.paymentStatus = async ({ businessId, userId, orderId }) => {
  await ensure(businessId, userId);
  const p = await Payment.findOne({ businessId, orderId });
  if (!p) throw new ApiError(404, "Payment not found");
  const result = await paytm.status(orderId);
  const body = result?.body || result;
  const status = body?.resultInfo?.resultStatus || body?.resultInfo?.resultCode;
  const txnStatus = body?.txnStatus || body?.STATUS;
  p.providerResponse = result;
  p.providerTxnId = body?.txnId || body?.TXNID || p.providerTxnId;
  if (txnStatus === "TXN_SUCCESS" || status === "S") {
    p.status = "SUCCESS";
    await Subscription.updateOne({ _id: p.subscriptionId }, { status: "ACTIVE", startsAt: new Date(), endsAt: new Date(Date.now() + (p.amount >= 1000 ? 365 : 30) * 86400000), updatedBy: userId });
  } else if (txnStatus === "TXN_FAILURE" || status === "F") {
    p.status = "FAILED";
    await Subscription.updateOne({ _id: p.subscriptionId }, { status: "EXPIRED", updatedBy: userId });
  } else p.status = "PENDING";
  await p.save();
  return p;
};
exports.callback = async (payload) => {
  if (!(await paytm.verifyCallback(payload))) throw new ApiError(401, "Invalid Paytm callback signature");
  const orderId = payload.ORDERID || payload.orderId;
  if (!orderId) return null;
  const p = await Payment.findOne({ orderId });
  if (!p) return null;
  p.providerResponse = payload;
  p.providerTxnId = payload.TXNID || null;
  p.status = payload.STATUS === "TXN_SUCCESS" ? "SUCCESS" : payload.STATUS === "TXN_FAILURE" ? "FAILED" : "PENDING";
  await p.save();
  if (p.status === "SUCCESS") await Subscription.updateOne({ _id: p.subscriptionId }, { status: "ACTIVE", startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 86400000) });
  return p;
};
