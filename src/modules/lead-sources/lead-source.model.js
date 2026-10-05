const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const leadSourceSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: ["SOURCE", "CAMPAIGN"],
      default: "SOURCE",
      index: true,
    },

    code: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    medium: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
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

leadSourceSchema.index({
  businessId: 1,
  type: 1,
  active: 1,
});

leadSourceSchema.index(
  {
    businessId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

leadSourceSchema.index({
  businessId: 1,
  code: 1,
});

registerModelEvents(leadSourceSchema, "lead-source");

module.exports = mongoose.model("LeadSource", leadSourceSchema);
