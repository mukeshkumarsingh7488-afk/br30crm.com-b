const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
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
      maxlength: 100,
    },

    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      index: true,
    },

    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "REVOKED"],
      default: "ACTIVE",
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastUsedAt: {
      type: Date,
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

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
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

apiKeySchema.index({
  businessId: 1,
  status: 1,
});

apiKeySchema.index({
  businessId: 1,
  createdAt: -1,
});

apiKeySchema.index({
  businessId: 1,
  keyPrefix: 1,
});

module.exports = mongoose.model("ApiKey", apiKeySchema);
