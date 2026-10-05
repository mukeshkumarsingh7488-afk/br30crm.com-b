const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    deviceName: { type: String, default: "Unknown device", maxlength: 120 },
    userAgent: { type: String, default: "", maxlength: 1000 },
    ipAddress: { type: String, default: "", maxlength: 100 },
    lastUsedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null, index: true },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ userId: 1, revokedAt: 1, lastUsedAt: -1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("Session", schema);
