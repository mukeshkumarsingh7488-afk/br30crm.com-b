const mongoose = require("mongoose");

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    metric: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true,
    },

    period: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"],
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    value: {
      type: Number,
      default: 0,
    },

    dimensions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSnapshotSchema.index({
  businessId: 1,
  metric: 1,
  period: 1,
  startDate: 1,
  endDate: 1,
});

analyticsSnapshotSchema.index({
  businessId: 1,
  generatedAt: -1,
});

module.exports = mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
