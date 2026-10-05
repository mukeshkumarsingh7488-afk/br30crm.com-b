const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const companySchema = new mongoose.Schema(
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
      minlength: 2,
      maxlength: 200,
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 250,
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

    website: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      index: true,
    },

    companySize: {
      type: String,
      enum: ["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"],
      default: "SMALL",
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

companySchema.index({
  businessId: 1,
  status: 1,
});

companySchema.index({
  businessId: 1,
  industry: 1,
});

companySchema.index({
  businessId: 1,
  companySize: 1,
});

companySchema.index({
  businessId: 1,
  assignedTo: 1,
});

companySchema.index({
  businessId: 1,
  assignedTeamId: 1,
});

companySchema.index({
  businessId: 1,
  source: 1,
});

companySchema.index({
  businessId: 1,
  createdAt: -1,
});

companySchema.index({
  businessId: 1,
  name: 1,
});

registerModelEvents(companySchema, "company");

module.exports = mongoose.model("Company", companySchema);
