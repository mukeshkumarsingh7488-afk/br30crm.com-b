const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const communicationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["EMAIL", "WHATSAPP", "SMS"],
      required: true,
      index: true,
    },

    direction: {
      type: String,
      enum: ["OUTBOUND", "INBOUND"],
      default: "OUTBOUND",
    },

    to: {
      type: String,
      trim: true,
    },

    from: {
      type: String,
      trim: true,
      default: null,
    },

    subject: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    body: {
      type: String,
      required: true,
      maxlength: 20000,
    },

    status: {
      type: String,
      enum: ["QUEUED", "SENT", "DELIVERED", "FAILED", "RECEIVED"],
      default: "QUEUED",
      index: true,
    },

    provider: {
      type: String,
      trim: true,
      default: null,
    },

    providerMessageId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    relatedTo: {
      type: {
        type: String,
        enum: ["LEAD", "CONTACT", "COMPANY", "DEAL"],
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    errorMessage: {
      type: String,
      trim: true,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

communicationSchema.index({
  businessId: 1,
  createdAt: -1,
});

communicationSchema.index({
  businessId: 1,
  to: 1,
  channel: 1,
});

communicationSchema.index({
  businessId: 1,
  channel: 1,
  providerMessageId: 1,
});

communicationSchema.index({
  businessId: 1,
  direction: 1,
  createdAt: -1,
});

registerModelEvents(communicationSchema, "communication");

module.exports = mongoose.model("Communication", communicationSchema);
