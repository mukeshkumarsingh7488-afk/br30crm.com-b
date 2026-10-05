const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["GOOGLE", "OUTLOOK"], required: true, index: true },
    providerAccountId: { type: String, default: null, index: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    displayName: { type: String, trim: true, default: null },
    accessTokenEncrypted: { type: String, default: null },
    refreshTokenEncrypted: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
    scope: { type: String, default: null },
    defaultCalendarId: { type: String, default: null },
    status: { type: String, enum: ["CONNECTED", "EXPIRED", "ERROR", "DISCONNECTED"], default: "CONNECTED", index: true },
    lastSyncAt: { type: Date, default: null },
    lastSyncError: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ businessId: 1, userId: 1, provider: 1 }, { unique: true });
module.exports = mongoose.model("CalendarAccount", schema);
