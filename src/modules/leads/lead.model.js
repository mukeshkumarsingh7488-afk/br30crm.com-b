const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const leadSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 200,
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

    companyName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
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
      enum: ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"],
      default: "NEW",
      index: true,
    },

    rating: {
      type: String,
      enum: ["HOT", "WARM", "COLD"],
      default: "WARM",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
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

    lastContactedAt: {
      type: Date,
      default: null,
    },

    convertedAt: {
      type: Date,
      default: null,
    },

    convertedContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    convertedCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    convertedDealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
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

leadSchema.index({
  businessId: 1,
  status: 1,
});

leadSchema.index({
  businessId: 1,
  assignedTo: 1,
});

leadSchema.index({
  businessId: 1,
  assignedTeamId: 1,
});

leadSchema.index({
  businessId: 1,
  source: 1,
});

leadSchema.index({
  businessId: 1,
  createdAt: -1,
});

leadSchema.index({
  businessId: 1,
  email: 1,
});

registerModelEvents(leadSchema, "lead");

module.exports = mongoose.model("Lead", leadSchema);
