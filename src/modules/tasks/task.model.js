const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const taskSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "TODO",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
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

    completedAt: {
      type: Date,
      default: null,
    },

    relatedTo: {
      type: {
        type: String,
        enum: ["LEAD", "CONTACT", "COMPANY", "DEAL"],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
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

taskSchema.index({
  businessId: 1,
  status: 1,
  assignedTo: 1,
});

taskSchema.index({
  businessId: 1,
  dueDate: 1,
});

taskSchema.index({
  businessId: 1,
  isActive: 1,
  createdAt: -1,
});

taskSchema.index({
  businessId: 1,
  isActive: 1,
  status: 1,
});

taskSchema.index({
  businessId: 1,
  isActive: 1,
  assignedTo: 1,
});

registerModelEvents(taskSchema, "task");

module.exports = mongoose.model("Task", taskSchema);
