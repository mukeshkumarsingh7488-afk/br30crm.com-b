const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const qrSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicForm",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 180,
      default: "",
    },

    publicUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    size: {
      type: Number,
      min: 128,
      max: 2048,
      default: 400,
    },

    margin: {
      type: Number,
      min: 0,
      max: 20,
      default: 2,
    },

    errorCorrectionLevel: {
      type: String,
      enum: ["L", "M", "Q", "H"],
      default: "M",
    },

    format: {
      type: String,
      enum: ["png", "svg"],
      default: "png",
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastScannedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

qrSchema.index({
  businessId: 1,
  formId: 1,
});

qrSchema.index({
  businessId: 1,
  active: 1,
});

qrSchema.index({
  businessId: 1,
  createdAt: -1,
});

registerModelEvents(qrSchema, "qr");

module.exports = mongoose.model("FormQrCode", qrSchema);
