const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const businessMemberSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
 * A user can belong to a business only once.
 */
businessMemberSchema.index(
  {
    businessId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

/*
 * Useful for finding all active members of a business.
 */
businessMemberSchema.index({
  businessId: 1,
  status: 1,
});

/*
 * Useful for finding all businesses of a user.
 */
businessMemberSchema.index({
  userId: 1,
  status: 1,
});

registerModelEvents(businessMemberSchema, "business-member");

module.exports = mongoose.model("BusinessMember", businessMemberSchema);
