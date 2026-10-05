const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 180,
      index: true,
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    businessType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    logo: {
      type: String,
      trim: true,
      default: null,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    address: {
      line1: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      line2: {
        type: String,
        trim: true,
        maxlength: 200,
        default: null,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
        default: null,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },
    },

    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
      minlength: 3,
      maxlength: 3,
    },

    dateFormat: {
      type: String,
      trim: true,
      default: "DD/MM/YYYY",
    },

    timeFormat: {
      type: String,
      enum: ["12h", "24h"],
      default: "12h",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
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

businessSchema.index({
  ownerId: 1,
  status: 1,
});

businessSchema.index({
  name: 1,
});

module.exports = mongoose.model("Business", businessSchema);
