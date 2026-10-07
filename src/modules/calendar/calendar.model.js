const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const CALENDAR_EVENT_TYPES = ["EVENT", "APPOINTMENT", "BLOCKED_TIME", "HOLIDAY", "REMINDER", "EXTERNAL", "OTHER"];

const CALENDAR_EVENT_STATUS = ["SCHEDULED", "CONFIRMED", "TENTATIVE", "CANCELLED", "COMPLETED"];

const CALENDAR_VISIBILITY = ["PRIVATE", "BUSINESS"];

const CALENDAR_SOURCE_TYPES = ["INTERNAL", "GOOGLE", "OUTLOOK"];

const calendarSchema = new mongoose.Schema(
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
      default: null,
    },

    type: {
      type: String,
      enum: CALENDAR_EVENT_TYPES,
      default: "EVENT",
      uppercase: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: CALENDAR_EVENT_STATUS,
      default: "SCHEDULED",
      uppercase: true,
      trim: true,
      index: true,
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

    allDay: {
      type: Boolean,
      default: false,
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Asia/Kolkata",
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
          maxlength: 200,
          default: null,
        },

        response: {
          type: String,
          enum: ["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"],
          default: "PENDING",
        },
      },
    ],

    visibility: {
      type: String,
      enum: CALENDAR_VISIBILITY,
      default: "BUSINESS",
      index: true,
    },

    source: {
      type: String,
      enum: CALENDAR_SOURCE_TYPES,
      default: "INTERNAL",
      index: true,
    },

    externalEventId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    externalCalendarId: {
      type: String,
      trim: true,
      default: null,
    },

    externalAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalendarAccount",
      default: null,
      index: true,
    },

    relatedTo: {
      type: {
        type: String,
        enum: ["MEETING", "ACTIVITY", "LEAD", "CONTACT", "COMPANY", "DEAL", "OTHER"],
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
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
          enum: ["IN_APP", "EMAIL", "WHATSAPP", "SMS"],
          default: "IN_APP",
        },
      },
    ],

    recurrence: {
      enabled: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
        default: null,
      },

      interval: {
        type: Number,
        min: 1,
        default: 1,
      },

      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],

      endAt: {
        type: Date,
        default: null,
      },

      count: {
        type: Number,
        min: 1,
        default: null,
      },
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
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

calendarSchema.index({
  businessId: 1,
  startAt: 1,
  endAt: 1,
  isDeleted: 1,
});

calendarSchema.index({
  businessId: 1,
  organizerId: 1,
  startAt: 1,
  isDeleted: 1,
});

calendarSchema.index({
  businessId: 1,
  status: 1,
  startAt: 1,
  isDeleted: 1,
});

calendarSchema.index({
  businessId: 1,
  source: 1,
  externalEventId: 1,
});

calendarSchema.index({
  externalAccountId: 1,
  externalEventId: 1,
});

calendarSchema.index({
  businessId: 1,
  "relatedTo.type": 1,
  "relatedTo.id": 1,
});

calendarSchema.index({
  businessId: 1,
  createdAt: -1,
  isDeleted: 1,
});

const Calendar = mongoose.model("Calendar", calendarSchema);

registerModelEvents(calendarSchema, "calendar");

module.exports = Calendar;

module.exports.CALENDAR_EVENT_TYPES = CALENDAR_EVENT_TYPES;
module.exports.CALENDAR_EVENT_STATUS = CALENDAR_EVENT_STATUS;
module.exports.CALENDAR_VISIBILITY = CALENDAR_VISIBILITY;
module.exports.CALENDAR_SOURCE_TYPES = CALENDAR_SOURCE_TYPES;
