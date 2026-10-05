const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const webhookSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    events: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 100,
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "FAILED"],
      default: "INACTIVE",
      index: true,
    },

    secretPrefix: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    secretHash: {
      type: String,
      trim: true,
      default: null,
    },

    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    retryEnabled: {
      type: Boolean,
      default: true,
    },

    maxRetries: {
      type: Number,
      min: 0,
      max: 10,
      default: 3,
    },

    timeoutMs: {
      type: Number,
      min: 1000,
      max: 120000,
      default: 10000,
    },

    lastDeliveredAt: {
      type: Date,
      default: null,
    },

    lastFailedAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

webhookSchema.index({
  businessId: 1,
  status: 1,
});

webhookSchema.index({
  businessId: 1,
  createdAt: -1,
});

webhookSchema.index({
  businessId: 1,
  url: 1,
});

webhookSchema.index({
  businessId: 1,
  events: 1,
});

registerModelEvents(webhookSchema, "webhook");

module.exports = mongoose.model("Webhook", webhookSchema);
