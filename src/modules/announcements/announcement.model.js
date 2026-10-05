const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
      index: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    type: {
      type: String,
      enum: ["NEW_FEATURE", "IMPROVEMENT", "UPDATE", "FIX", "SECURITY", "MAINTENANCE", "RELEASE"],
      default: "NEW_FEATURE",
      required: true,
      index: true,
    },

    releaseType: {
      type: String,
      enum: ["CURRENT", "UPCOMING"],
      default: "CURRENT",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      required: true,
      index: true,
    },

    visibility: {
      type: String,
      enum: ["PUBLIC", "AUTHENTICATED", "BUSINESS"],
      default: "PUBLIC",
      required: true,
      index: true,
    },

    scope: {
      type: String,
      enum: ["SYSTEM", "BUSINESS"],
      default: "SYSTEM",
      required: true,
      index: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },

    version: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    videoUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    videoThumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["NONE", "IMAGE", "VIDEO"],
      default: "NONE",
    },

    ctaText: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    ctaUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    targetAudience: {
      type: String,
      enum: ["ALL", "ADMIN", "MANAGER", "SALES", "STAFF"],
      default: "ALL",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    releaseDate: {
      type: Date,
      default: null,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
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

announcementSchema.index({
  slug: 1,
  scope: 1,
  businessId: 1,
});

announcementSchema.index({
  status: 1,
  releaseType: 1,
  publishedAt: -1,
});

announcementSchema.index({
  visibility: 1,
  targetAudience: 1,
  status: 1,
});

announcementSchema.index({
  businessId: 1,
  status: 1,
  releaseType: 1,
  displayOrder: 1,
});

registerModelEvents(announcementSchema, "announcement");

module.exports = mongoose.model("Announcement", announcementSchema);
