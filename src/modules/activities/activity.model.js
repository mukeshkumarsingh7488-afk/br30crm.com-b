const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "NOTE", "SMS", "WHATSAPP", "FOLLOW_UP", "OTHER"];

const ACTIVITY_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const ACTIVITY_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const activitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      uppercase: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    status: {
      type: String,
      enum: ACTIVITY_STATUSES,
      default: "PLANNED",
      uppercase: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ACTIVITY_PRIORITIES,
      default: "MEDIUM",
      uppercase: true,
    },

    dueAt: {
      type: Date,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
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

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
      index: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    outcome: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    reminderAt: {
      type: Date,
      default: null,
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Business + status + due date
 */
activitySchema.index({
  businessId: 1,
  status: 1,
  dueAt: 1,
});

/*
 * Business + assigned user + newest activities
 */
activitySchema.index({
  businessId: 1,
  assignedTo: 1,
  createdAt: -1,
});

/*
 * Business + deleted state + newest activities
 */
activitySchema.index({
  businessId: 1,
  isDeleted: 1,
  createdAt: -1,
});

/*
 * Business + activity type + newest activities
 */
activitySchema.index({
  businessId: 1,
  type: 1,
  createdAt: -1,
});

/*
 * Business + priority + newest activities
 */
activitySchema.index({
  businessId: 1,
  priority: 1,
  createdAt: -1,
});

registerModelEvents(activitySchema, "activity");

module.exports = mongoose.model("Activity", activitySchema);

module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.ACTIVITY_STATUSES = ACTIVITY_STATUSES;
module.exports.ACTIVITY_PRIORITIES = ACTIVITY_PRIORITIES;
