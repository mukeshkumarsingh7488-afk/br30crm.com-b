const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["SYSTEM", "LEAD", "CONTACT", "COMPANY", "DEAL", "TASK", "ACTIVITY", "AUTOMATION", "WEBHOOK", "INTEGRATION", "SECURITY", "WORKFLOW", "PIPELINE", "TEAM", "ROLE", "FORM", "SOURCE", "OTHER"],
      default: "SYSTEM",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
      index: true,
    },

    status: {
      type: String,
      enum: ["UNREAD", "READ", "ARCHIVED"],
      default: "UNREAD",
      index: true,
    },

    actionUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    entityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    readAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  businessId: 1,
  recipientId: 1,
  status: 1,
  createdAt: -1,
});

notificationSchema.index({
  businessId: 1,
  recipientId: 1,
  createdAt: -1,
});

notificationSchema.index({
  expiresAt: 1,
});

module.exports = mongoose.model("Notification", notificationSchema);
