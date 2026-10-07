const crypto = require("crypto");
const Business = require("../businesses/business.model");
const Lead = require("../leads/lead.model");
const ApiError = require("../../utils/ApiError");

const verifySignature = (raw, signature, secret) => {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const provided = String(signature).replace(/^sha256=/, "");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
};

const getBusiness = async (businessId) => {
  const business = await Business.findOne({ _id: businessId, status: "ACTIVE" });
  if (!business) throw new ApiError(404, "Active business not found.");
  return business;
};

const getConfig = async (businessId) => {
  const business = await getBusiness(businessId);
  const secret = business.settings?.socialWebhookSecret || "";
  return {
    configured: Boolean(secret),
    secretPreview: secret ? `${secret.slice(0, 8)}••••${secret.slice(-4)}` : null,
    endpoint: `/api/v1/social-leads/${businessId}/{source}`,
  };
};

const rotateSecret = async ({ businessId, userId }) => {
  const business = await getBusiness(businessId);
  const secret = `br30_social_${crypto.randomBytes(32).toString("hex")}`;
  business.settings = { ...(business.settings || {}), socialWebhookSecret: secret };
  business.updatedBy = userId;
  business.markModified("settings");
  await business.save();
  return { secret, endpoint: `/api/v1/social-leads/${businessId}/{source}` };
};

const ingest = async ({ businessId, source, payload, signature, rawBody }) => {
  const business = await getBusiness(businessId);
  const secret = business.settings?.socialWebhookSecret || process.env.SOCIAL_WEBHOOK_SECRET;
  if (secret && !verifySignature(rawBody || JSON.stringify(payload), signature, secret)) throw new ApiError(401, "Invalid social webhook signature.");
  const data = payload || {};
  const lead = await Lead.create({
    businessId,
    firstName: data.firstName || data.first_name || null,
    lastName: data.lastName || data.last_name || null,
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || data.phone_number || null,
    companyName: data.companyName || data.company || null,
    source: String(source || "social").toLowerCase(),
    description: data.message || null,
    customFields: { socialPayload: data },
    createdBy: business.ownerId,
  });
  return lead;
};

module.exports = { getConfig, rotateSecret, ingest };
