const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    calendarEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    minutesBefore: { type: Number, required: true, min: 0, max: 10080 },
    channel: { type: String, enum: ["IN_APP", "EMAIL", "WHATSAPP", "SMS"], default: "IN_APP" },
    scheduledFor: { type: Date, required: true, index: true },
    status: { type: String, enum: ["PENDING", "SENT", "FAILED", "CANCELLED"], default: "PENDING", index: true },
    sentAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ status: 1, scheduledFor: 1 });
schema.index({ calendarEventId: 1, minutesBefore: 1, channel: 1 }, { unique: true });
module.exports = mongoose.model("CalendarReminder", schema);
