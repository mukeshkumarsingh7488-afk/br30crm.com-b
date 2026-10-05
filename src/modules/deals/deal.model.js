const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const dealSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    pipelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pipeline",
      required: true,
      index: true,
    },

    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: null,
      maxlength: 5000,
    },

    value: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
      maxlength: 10,
    },

    expectedCloseDate: {
      type: Date,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "WON", "LOST"],
      default: "OPEN",
      index: true,
    },

    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    source: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    wonAt: {
      type: Date,
      default: null,
    },

    lostAt: {
      type: Date,
      default: null,
    },

    lostReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

dealSchema.index({
  businessId: 1,
  pipelineId: 1,
});

dealSchema.index({
  businessId: 1,
  status: 1,
});

dealSchema.index({
  businessId: 1,
  assignedTo: 1,
});

dealSchema.index({
  businessId: 1,
  expectedCloseDate: 1,
});

registerModelEvents(dealSchema, "deal");

module.exports = mongoose.model("Deal", dealSchema);
