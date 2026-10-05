const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const tagSchema = new mongoose.Schema(
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
      minlength: 1,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    type: {
      type: String,
      enum: ["SYSTEM", "CUSTOM"],
      default: "CUSTOM",
      required: true,
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

tagSchema.index({ businessId: 1, slug: 1 }, { unique: true });

tagSchema.index({
  businessId: 1,
  isActive: 1,
});

tagSchema.index({
  businessId: 1,
  type: 1,
  isActive: 1,
});

registerModelEvents(tagSchema, "tag");

module.exports = mongoose.model("Tag", tagSchema);
