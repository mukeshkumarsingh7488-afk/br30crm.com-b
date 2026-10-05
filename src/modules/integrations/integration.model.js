const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const integrationSchema = new mongoose.Schema(
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

    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["EMAIL", "SMS", "WHATSAPP", "PAYMENT", "STORAGE", "CALENDAR", "ACCOUNTING", "MARKETING", "OTHER"],
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ERROR", "DISCONNECTED"],
      default: "INACTIVE",
      index: true,
    },

    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    lastConnectedAt: {
      type: Date,
      default: null,
    },

    lastSyncAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
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

integrationSchema.index({
  businessId: 1,
  provider: 1,
});

integrationSchema.index({
  businessId: 1,
  type: 1,
});

integrationSchema.index({
  businessId: 1,
  status: 1,
});

integrationSchema.index({
  businessId: 1,
  createdAt: -1,
});

registerModelEvents(integrationSchema, "integration");

module.exports = mongoose.model("Integration", integrationSchema);
