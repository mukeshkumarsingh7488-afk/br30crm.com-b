const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const MEETING_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

const ATTENDEE_RESPONSES = ["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"];

const REMINDER_CHANNELS = ["IN_APP", "EMAIL", "WHATSAPP", "SMS"];

const RELATED_TYPES = ["LEAD", "CONTACT", "COMPANY", "DEAL"];

const meetingSchema = new mongoose.Schema(
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
      maxlength: 5000,
      default: "",
    },

    startAt: {
      type: Date,
      required: true,
      index: true,
    },

    endAt: {
      type: Date,
      required: true,
      index: true,
    },

    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
      maxlength: 100,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    meetingUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "SCHEDULED",
      index: true,
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    attendees: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        email: {
          type: String,
          lowercase: true,
          trim: true,
          default: null,
        },

        name: {
          type: String,
          trim: true,
          default: null,
        },

        response: {
          type: String,
          enum: ATTENDEE_RESPONSES,
          default: "PENDING",
        },
      },
    ],

    relatedTo: {
      type: {
        type: String,
        enum: RELATED_TYPES,
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    reminders: [
      {
        minutesBefore: {
          type: Number,
          min: 0,
          max: 10080,
          required: true,
        },

        channel: {
          type: String,
          enum: REMINDER_CHANNELS,
          default: "IN_APP",
        },
      },
    ],

    outcome: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },

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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

meetingSchema.index({
  businessId: 1,
  startAt: 1,
  isDeleted: 1,
});

meetingSchema.index({
  businessId: 1,
  organizerId: 1,
  startAt: 1,
  isDeleted: 1,
});

meetingSchema.index({
  businessId: 1,
  status: 1,
  startAt: 1,
  isDeleted: 1,
});

meetingSchema.index({
  businessId: 1,
  createdAt: -1,
  isDeleted: 1,
});

registerModelEvents(meetingSchema, "meeting");

module.exports = mongoose.model("Meeting", meetingSchema);

module.exports.MEETING_STATUSES = MEETING_STATUSES;
module.exports.ATTENDEE_RESPONSES = ATTENDEE_RESPONSES;
module.exports.REMINDER_CHANNELS = REMINDER_CHANNELS;
module.exports.RELATED_TYPES = RELATED_TYPES;
