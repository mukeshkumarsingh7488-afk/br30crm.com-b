const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    entityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "INFO",
      index: true,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
      index: true,
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    requestId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({
  businessId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  businessId: 1,
  module: 1,
  action: 1,
  createdAt: -1,
});

auditLogSchema.index({
  businessId: 1,
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  businessId: 1,
  actorId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
