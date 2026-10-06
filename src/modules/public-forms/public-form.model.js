const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const publicFormFieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["name", "text", "email", "phone", "number", "textarea", "select", "date"],
      default: "text",
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    placeholder: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    helpText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const publicFormSchema = new mongoose.Schema(
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

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    purpose: {
      type: String,
      enum: ["LEAD", "SUPPORT"],
      default: "LEAD",
      index: true,
    },

    fields: {
      type: [publicFormFieldSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one public form field is required.",
      },
    },

    source: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: "website",
    },

    campaign: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    successMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "Thank you. We will contact you shortly.",
    },

    redirectUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },

    spamProtection: {
      type: Boolean,
      default: true,
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    stats: {
      views: {
        type: Number,
        default: 0,
      },
      submissions: {
        type: Number,
        default: 0,
      },
      uniqueViews: {
        type: Number,
        default: 0,
      },
      lastViewedAt: {
        type: Date,
        default: null,
      },
      lastSubmittedAt: {
        type: Date,
        default: null,
      },
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

publicFormSchema.index({ businessId: 1, slug: 1 }, { unique: true });

publicFormSchema.index({
  businessId: 1,
  status: 1,
});

publicFormSchema.index({
  businessId: 1,
  source: 1,
});

publicFormSchema.index({
  businessId: 1,
  purpose: 1,
});

publicFormSchema.index({
  businessId: 1,
  campaign: 1,
});

registerModelEvents(publicFormSchema, "public-form");

module.exports = mongoose.model("PublicForm", publicFormSchema);
