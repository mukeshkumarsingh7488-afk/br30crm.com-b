const crypto = require("crypto");
const CalendarAccount = require("./calendar-account.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const secret = crypto.createHash("sha256").update(`${env.jwtAccessSecret}:calendar`).digest();
const encrypt = (value) => {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
};
const decrypt = (value) => {
  if (!value) return null;
  try {
    const [ivHex, tagHex, dataHex] = String(value).split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", secret, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
  } catch (e) {
    return null;
  }
};
const ensure = async (businessId, userId) => {
  const m = await BusinessMember.findOne({ businessId, userId, status: "ACTIVE" }).lean();
  if (!m) throw new ApiError(403, "You are not an active member of this business.");
};
const list = async ({ businessId, userId, provider }) => {
  await ensure(businessId, userId);
  const q = { businessId, userId };
  if (provider) q.provider = provider;
  return CalendarAccount.find(q).select("-accessTokenEncrypted -refreshTokenEncrypted").sort({ createdAt: -1 }).lean();
};
const get = async ({ businessId, userId, accountId }) => {
  await ensure(businessId, userId);
  const a = await CalendarAccount.findOne({ _id: accountId, businessId, userId });
  if (!a) throw new ApiError(404, "Calendar account not found.");
  return a;
};
const saveTokens = async ({ businessId, userId, provider, tokens, profile = {} }) => {
  await ensure(businessId, userId);
  return CalendarAccount.findOneAndUpdate(
    { businessId, userId, provider },
    {
      $set: {
        providerAccountId: profile.id || null,
        email: profile.email || null,
        displayName: profile.name || null,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
        tokenExpiresAt: tokens.expiresAt || null,
        scope: tokens.scope || null,
        status: "CONNECTED",
        lastSyncError: null,
        updatedBy: userId,
      },
      $setOnInsert: { createdBy: userId },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
};
const disconnect = async ({ businessId, userId, accountId }) => {
  const a = await get({ businessId, userId, accountId });
  a.status = "DISCONNECTED";
  a.accessTokenEncrypted = null;
  a.refreshTokenEncrypted = null;
  a.updatedBy = userId;
  await a.save();
  return a;
};
const tokens = async (account) => ({ accessToken: decrypt(account.accessTokenEncrypted), refreshToken: decrypt(account.refreshTokenEncrypted), expiresAt: account.tokenExpiresAt });
module.exports = { list, get, saveTokens, disconnect, tokens, encrypt, decrypt };
