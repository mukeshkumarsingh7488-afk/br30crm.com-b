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

businessMemberSchema.index(
  {
    businessId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

businessMemberSchema.index({
  businessId: 1,
  status: 1,
});

businessMemberSchema.index({
  userId: 1,
  status: 1,
});

registerModelEvents(businessMemberSchema, "business-member");

module.exports = mongoose.model("BusinessMember", businessMemberSchema);
