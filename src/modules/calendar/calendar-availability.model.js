const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    workingDays: [{ type: Number, min: 0, max: 6 }],
    workingHours: { start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
    breaks: [{ start: String, end: String }],
    blockedSlots: [{ startAt: Date, endAt: Date, title: { type: String, default: null } }],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ businessId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("CalendarAvailability", schema);
