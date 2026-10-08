const crypto = require("crypto");

const Session = require("./session.model");

const ApiError = require("../../utils/ApiError");

const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");

const create = async ({ userId, sessionId, refreshToken, deviceName, userAgent, ipAddress, expiresAt }) =>
  Session.create({
    userId,
    sessionId,
    tokenHash: hash(refreshToken),
    deviceName,
    userAgent,
    ipAddress,
    expiresAt,
  });

const findByToken = async (token) => {
  const session = await Session.findOne({
    tokenHash: hash(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");

  if (session) {
    session.lastUsedAt = new Date();
    await session.save();
  }

  return session;
};

const revoke = async ({ userId, sessionId }) => {
  const s = await Session.findOneAndUpdate(
    {
      userId,
      sessionId,
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
    },
    { returnDocument: "after" }
  );

  if (!s) throw new ApiError(404, "Session not found.");

  return s;
};

const revokeAll = async (userId, currentSessionId = null) => {
  const filter = { userId, revokedAt: null };
  if (currentSessionId) filter.sessionId = { $ne: currentSessionId };
  const result = await Session.updateMany(filter, { $set: { revokedAt: new Date() } });
  return { revoked: result.modifiedCount };
};

const list = async (userId) =>
  Session.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("-tokenHash")
    .sort({ lastUsedAt: -1 })
    .lean();

module.exports = {
  hash,
  create,
  findByToken,
  revoke,
  revokeAll,
  list,
};
