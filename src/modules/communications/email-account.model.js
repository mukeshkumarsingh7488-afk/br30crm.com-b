const mongoose = require("mongoose");

const emailAccountSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["GOOGLE", "OUTLOOK"], required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    displayName: { type: String, trim: true, default: null },
    status: { type: String, enum: ["ACTIVE", "ERROR", "DISCONNECTED"], default: "ACTIVE", index: true },
    credentials: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSyncAt: { type: Date, default: null },
    lastConnectedAt: { type: Date, default: null },
    errorMessage: { type: String, trim: true, maxlength: 1000, default: null },
  },
  { timestamps: true, versionKey: false }
);

emailAccountSchema.index({ businessId: 1, userId: 1, provider: 1 }, { unique: true });
emailAccountSchema.index({ businessId: 1, email: 1 });
emailAccountSchema.index({ businessId: 1, status: 1, lastSyncAt: 1 });

module.exports = mongoose.model("EmailAccount", emailAccountSchema);
