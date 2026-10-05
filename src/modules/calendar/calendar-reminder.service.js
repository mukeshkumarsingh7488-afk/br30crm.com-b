const CalendarReminder = require("./calendar-reminder.model");
const Calendar = require("./calendar.model");
const ApiError = require("../../utils/ApiError");
const buildForEvent = async ({ businessId, userId, eventId }) => {
  const event = await Calendar.findOne({ _id: eventId, businessId, isDeleted: false });
  if (!event) throw new ApiError(404, "Calendar event not found.");
  await CalendarReminder.deleteMany({ calendarEventId: event._id, status: "PENDING" });
  const docs = (event.reminders || []).map((r) => ({ businessId, calendarEventId: event._id, userId, minutesBefore: r.minutesBefore, channel: r.channel, scheduledFor: new Date(new Date(event.startAt).getTime() - r.minutesBefore * 60000) }));
  return docs.length
    ? CalendarReminder.insertMany(docs, { ordered: false }).catch((e) => {
        if (e.code === 11000) return CalendarReminder.find({ calendarEventId: event._id });
        throw e;
      })
    : [];
};
const due = async (limit = 100) =>
  CalendarReminder.find({ status: "PENDING", scheduledFor: { $lte: new Date() } })
    .sort({ scheduledFor: 1 })
    .limit(limit);
const markSent = async (id) => CalendarReminder.findOneAndUpdate({ _id: id, status: "PENDING" }, { $set: { status: "SENT", sentAt: new Date() } }, { returnDocument: "after" });
const markFailed = async (id, error) => CalendarReminder.findOneAndUpdate({ _id: id, status: "PENDING" }, { $set: { status: "FAILED", error: String(error || "Reminder failed") } }, { returnDocument: "after" });
module.exports = { buildForEvent, due, markSent, markFailed };
