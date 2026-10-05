const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    direction: { type: String, enum: ["IMPORT", "EXPORT"], required: true, index: true },
    entityType: { type: String, enum: ["LEAD", "CONTACT", "COMPANY", "DEAL"], required: true, index: true },
    status: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], default: "PENDING", index: true },
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    successRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    rowErrors: { type: Array, default: [] },
    fileName: { type: String, default: null },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ businessId: 1, createdAt: -1 });
module.exports = mongoose.model("ImportJob", schema);
