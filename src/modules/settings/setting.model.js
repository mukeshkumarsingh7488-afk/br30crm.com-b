const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const settingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      unique: true,
      index: true,
    },

    general: {
      businessName: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      legalName: {
        type: String,
        trim: true,
        maxlength: 250,
        default: "",
      },

      description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      website: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      logoUrl: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 255,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },

    regional: {
      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "Asia/Kolkata",
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10,
        default: "INR",
      },

      dateFormat: {
        type: String,
        trim: true,
        maxlength: 30,
        default: "DD/MM/YYYY",
      },

      timeFormat: {
        type: String,
        enum: ["12h", "24h"],
        default: "12h",
      },

      language: {
        type: String,
        trim: true,
        maxlength: 20,
        default: "en",
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "IN",
      },
    },

    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },

      pushEnabled: {
        type: Boolean,
        default: true,
      },

      smsEnabled: {
        type: Boolean,
        default: false,
      },

      inAppEnabled: {
        type: Boolean,
        default: true,
      },

      leadNotifications: {
        type: Boolean,
        default: true,
      },

      dealNotifications: {
        type: Boolean,
        default: true,
      },

      taskNotifications: {
        type: Boolean,
        default: true,
      },

      activityNotifications: {
        type: Boolean,
        default: true,
      },

      automationNotifications: {
        type: Boolean,
        default: true,
      },

      securityNotifications: {
        type: Boolean,
        default: true,
      },
    },

    security: {
      sessionTimeoutMinutes: {
        type: Number,
        min: 5,
        max: 43200,
        default: 1440,
      },

      maxLoginAttempts: {
        type: Number,
        min: 1,
        max: 20,
        default: 5,
      },

      requireStrongPassword: {
        type: Boolean,
        default: true,
      },

      requireTwoFactor: {
        type: Boolean,
        default: false,
      },

      allowMultipleSessions: {
        type: Boolean,
        default: true,
      },
    },

    crm: {
      defaultLeadStatus: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "NEW",
      },

      defaultDealStage: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      defaultPageSize: {
        type: Number,
        min: 5,
        max: 100,
        default: 20,
      },

      autoAssignLeads: {
        type: Boolean,
        default: false,
      },

      autoCreateActivities: {
        type: Boolean,
        default: false,
      },
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

registerModelEvents(settingSchema, "setting");

module.exports = mongoose.model("Setting", settingSchema);
