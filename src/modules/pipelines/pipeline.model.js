const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const pipelineStageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    order: {
      type: Number,
      required: true,
      min: 0,
    },

    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    isWon: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const pipelineSchema = new mongoose.Schema(
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
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 180,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    type: {
      type: String,
      enum: ["SALES", "SERVICE", "CUSTOM"],
      default: "SALES",
      index: true,
    },

    stages: {
      type: [pipelineStageSchema],
      default: [],
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
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

pipelineSchema.index(
  {
    businessId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

pipelineSchema.index({
  businessId: 1,
  status: 1,
});

pipelineSchema.index({
  businessId: 1,
  isDefault: 1,
});

pipelineSchema.index({
  businessId: 1,
  type: 1,
});

pipelineSchema.index({
  businessId: 1,
  createdAt: -1,
});

registerModelEvents(pipelineStageSchema, "pipeline");

module.exports = mongoose.model("Pipeline", pipelineSchema);
