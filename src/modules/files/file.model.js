const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    extension: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 20,
      default: "",
    },

    size: {
      type: Number,
      required: true,
      min: 0,
    },

    storageProvider: {
      type: String,
      enum: ["LOCAL", "CLOUDINARY", "S3", "OTHER"],
      default: "LOCAL",
    },

    storageKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    folder: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    visibility: {
      type: String,
      enum: ["PRIVATE", "BUSINESS"],
      default: "PRIVATE",
      index: true,
    },

    entityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["ACTIVE", "DELETED"],
      default: "ACTIVE",
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index({
  businessId: 1,
  status: 1,
  createdAt: -1,
});

fileSchema.index({
  businessId: 1,
  uploadedBy: 1,
  createdAt: -1,
});

fileSchema.index({
  businessId: 1,
  entityType: 1,
  entityId: 1,
});

fileSchema.index({
  businessId: 1,
  folder: 1,
});

module.exports = mongoose.model("File", fileSchema);
