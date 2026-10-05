const mongoose = require("mongoose");

const duplicateSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    entityType: { type: String, enum: ["CONTACT", "COMPANY", "LEAD"], required: true, index: true },
    primaryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    duplicateId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: ["EMAIL", "PHONE", "NAME"], required: true },
    status: { type: String, enum: ["OPEN", "IGNORED", "MERGED"], default: "OPEN", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

duplicateSchema.index({ businessId: 1, entityType: 1, primaryId: 1, duplicateId: 1, reason: 1 }, { unique: true });
module.exports = mongoose.model("Duplicate", duplicateSchema);
