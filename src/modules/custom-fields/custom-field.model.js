const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const customFieldSchema = new mongoose.Schema(
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

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    entity: {
      type: String,
      required: true,
      enum: ["LEAD", "CONTACT", "COMPANY", "DEAL", "ACTIVITY", "TASK", "NOTE"],
      index: true,
    },

    fieldType: {
      type: String,
      required: true,
      enum: ["TEXT", "TEXTAREA", "NUMBER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME", "EMAIL", "PHONE", "URL", "SELECT", "MULTI_SELECT"],
    },

    options: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },

        value: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
      },
    ],

    isRequired: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    placeholder: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    validation: {
      minLength: {
        type: Number,
        default: null,
      },

      maxLength: {
        type: Number,
        default: null,
      },

      minValue: {
        type: Number,
        default: null,
      },

      maxValue: {
        type: Number,
        default: null,
      },

      pattern: {
        type: String,
        default: null,
      },
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

customFieldSchema.index({ businessId: 1, entity: 1, slug: 1 }, { unique: true });

customFieldSchema.index({
  businessId: 1,
  entity: 1,
  isActive: 1,
  sortOrder: 1,
});

registerModelEvents(customFieldSchema, "custom-field");

module.exports = mongoose.model("CustomField", customFieldSchema);
