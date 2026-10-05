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

    /*
     * null means this is a platform/system-wide role.
     * ObjectId means the role belongs to one specific business.
     */
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },

    /*
     * System roles are predefined by the CRM.
     * Custom roles are created by a business.
     */
    type: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      required: true,
      default: "CUSTOM",
      index: true,
    },

    /*
     * Permission IDs will be connected after
     * the Permissions module is created.
     */
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

/*
 * A business cannot have two custom roles
 * with the same slug.
 *
 * For system roles, businessId is null and
 * slug must also remain unique.
 */
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
