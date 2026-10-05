const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const contactSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 200,
      default: null,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    alternatePhone: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    source: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      default: "manual",
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },

    lifecycleStage: {
      type: String,
      enum: ["CONTACT", "CUSTOMER", "REPEAT_CUSTOMER", "OTHER"],
      default: "CONTACT",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    address: {
      street: {
        type: String,
        trim: true,
        maxlength: 250,
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

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    lastContactedAt: {
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

contactSchema.index({
  businessId: 1,
  status: 1,
});

contactSchema.index({
  businessId: 1,
  lifecycleStage: 1,
});

contactSchema.index({
  businessId: 1,
  companyId: 1,
});

contactSchema.index({
  businessId: 1,
  assignedTo: 1,
});

contactSchema.index({
  businessId: 1,
  assignedTeamId: 1,
});

contactSchema.index({
  businessId: 1,
  createdAt: -1,
});

contactSchema.index({
  businessId: 1,
  email: 1,
});

contactSchema.index({
  businessId: 1,
  sourceLeadId: 1,
});

registerModelEvents(contactSchema, "contact");

module.exports = mongoose.model("Contact", contactSchema);
