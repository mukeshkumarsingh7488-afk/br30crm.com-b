const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    emailVerificationOtpHash: {
      type: String,
      required: true,
      select: false,
    },

    emailVerificationOtpExpiresAt: {
      type: Date,
      required: true,
      select: false,
    },

    emailVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    emailVerificationLastSentAt: {
      type: Date,
      default: Date.now,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    registrationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ============================================================
    // LEGAL CONSENT
    // ============================================================
    legalConsent: {
      accepted: {
        type: Boolean,
        default: false,
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      pages: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * Automatically delete expired pending registrations.
 */
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/*
 * One pending registration per email.
 */
pendingRegistrationSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);
