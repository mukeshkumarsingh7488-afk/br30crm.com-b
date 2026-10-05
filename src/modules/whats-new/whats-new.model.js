const mongoose = require("mongoose");

const whatsNewSchema = new mongoose.Schema(
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
      unique: true,
      index: true,
      maxlength: 220,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    version: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    type: {
      type: String,
      enum: ["NEW_FEATURE", "IMPROVEMENT", "FIX", "UPCOMING"],
      default: "NEW_FEATURE",
      index: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    mediaType: {
      type: String,
      enum: ["NONE", "IMAGE", "VIDEO"],
      default: "NONE",
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

    videoMuted: {
      type: Boolean,
      default: true,
    },

    videoAutoplay: {
      type: Boolean,
      default: true,
    },

    videoLoop: {
      type: Boolean,
      default: true,
    },

    howToUse: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    actionText: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    actionUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    features: {
      type: [String],
      default: [],
    },

    releaseDate: {
      type: Date,
      default: null,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

/*
 * Public listing index
 */
whatsNewSchema.index({
  status: 1,
  releaseDate: -1,
  sortOrder: 1,
  createdAt: -1,
});

/*
 * Admin filtering index
 */
whatsNewSchema.index({
  status: 1,
  type: 1,
  sortOrder: 1,
  releaseDate: -1,
});

/*
 * Search index
 */
whatsNewSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
  slug: "text",
});

module.exports = mongoose.model("WhatsNew", whatsNewSchema);
