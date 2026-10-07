const mongoose = require("mongoose");
const webhookDeliverySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    webhookId: { type: mongoose.Schema.Types.ObjectId, ref: "Webhook", required: true, index: true },
    event: { type: String, required: true, index: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING", index: true },
    httpStatus: { type: Number, default: null },
    attempts: { type: Number, default: 0 },
    responseMs: { type: Number, default: null },
    error: { type: String, maxlength: 2000, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    responseBody: { type: String, maxlength: 5000, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);
webhookDeliverySchema.index({ businessId: 1, webhookId: 1, createdAt: -1 });
module.exports = mongoose.model("WebhookDelivery", webhookDeliverySchema);
