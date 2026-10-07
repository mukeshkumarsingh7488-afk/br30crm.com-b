const crypto = require("crypto");
const base = () => (process.env.PAYTM_ENVIRONMENT === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in");
const config = () => ({ mid: process.env.PAYTM_MID, key: process.env.PAYTM_MERCHANT_KEY, website: process.env.PAYTM_WEBSITE || "WEB", callbackUrl: process.env.PAYTM_CALLBACK_URL || `${process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/subscription/payment/callback` });
const checksum = async (body, key) => {
  let PaytmChecksum;
  try {
    PaytmChecksum = require("paytmchecksum");
  } catch {
    throw new Error("Paytm checksum package is not installed. Run: npm i paytmchecksum");
  }
  return PaytmChecksum.generateSignature(JSON.stringify(body), key);
};
const initiate = async ({ orderId, customerId, email, mobile, amount }) => {
  const c = config();
  if (!c.mid || !c.key) throw new Error("Paytm credentials are not configured");
  const body = { requestType: "Payment", mid: c.mid, websiteName: c.website, orderId, custId: String(customerId), txnAmount: { value: Number(amount).toFixed(2), currency: "INR" }, userInfo: { custId: String(customerId) }, callbackUrl: c.callbackUrl };
  const signature = await checksum(body, c.key);
  const response = await fetch(`${base()}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(c.mid)}&orderId=${encodeURIComponent(orderId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, head: { signature } }) });
  const data = await response.json();
  if (!response.ok || data?.body?.resultInfo?.resultStatus === "F" || data?.body?.resultInfo?.resultStatus === "FAILURE") throw new Error(data?.body?.resultInfo?.resultMsg || "Paytm transaction initiation failed");
  return { txnToken: data?.body?.txnToken, orderId, mid: c.mid, amount: Number(amount).toFixed(2), host: base() };
};
const verifyCallback = async (payload) => {
  const c = config();
  if (!c.key) throw new Error("Paytm credentials are not configured");
  const checksumValue = payload?.CHECKSUMHASH || payload?.checksumhash;
  if (!checksumValue) return false;
  const body = { ...payload };
  delete body.CHECKSUMHASH;
  delete body.checksumhash;
  let PaytmChecksum;
  try {
    PaytmChecksum = require("paytmchecksum");
  } catch {
    throw new Error("Paytm checksum package is not installed. Run: npm i paytmchecksum");
  }
  return PaytmChecksum.verifySignature(body, c.key, checksumValue);
};
const status = async (orderId) => {
  const c = config();
  if (!c.mid || !c.key) throw new Error("Paytm credentials are not configured");
  const body = { mid: c.mid, orderId };
  const signature = await checksum(body, c.key);
  const response = await fetch(`${base()}/merchant-status/api/v1/getPaymentStatus?mid=${encodeURIComponent(c.mid)}&orderId=${encodeURIComponent(orderId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, head: { signature } }) });
  return response.json();
};
module.exports = { initiate, status, verifyCallback };
