const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 120,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      required: true,
      default: "CUSTOM",
      index: true,
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

roleSchema.index(
  {
    businessId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

roleSchema.index({
  businessId: 1,
  type: 1,
  isActive: 1,
});

roleSchema.index({
  businessId: 1,
  isDefault: 1,
});

registerModelEvents(roleSchema, "role");

module.exports = mongoose.model("Role", roleSchema);
