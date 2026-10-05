const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const leadAttributionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicForm",
      default: null,
      index: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadSource",
      default: null,
      index: true,
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadSource",
      default: null,
      index: true,
    },

    source: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: null,
    },

    medium: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: null,
    },

    campaign: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    term: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    referrer: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    landingPage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    landingUrl: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    trackingId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Qr",
      default: null,
      index: true,
    },

    touchType: {
      type: String,
      enum: ["FIRST", "LAST", "FORM", "QR", "DIRECT"],
      default: "FORM",
      index: true,
    },

    attributionType: {
      type: String,
      enum: ["FIRST_TOUCH", "LAST_TOUCH", "FORM_SUBMISSION", "QR_SCAN", "MANUAL"],
      default: "FORM_SUBMISSION",
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    createdBy: {
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

leadAttributionSchema.index({
  businessId: 1,
  leadId: 1,
});

leadAttributionSchema.index({
  businessId: 1,
  source: 1,
  campaign: 1,
});

leadAttributionSchema.index({
  businessId: 1,
  capturedAt: -1,
});

leadAttributionSchema.index({
  leadId: 1,
  attributionType: 1,
  capturedAt: 1,
});

registerModelEvents(leadAttributionSchema, "lead-attribution");

module.exports = mongoose.model("LeadAttribution", leadAttributionSchema);
