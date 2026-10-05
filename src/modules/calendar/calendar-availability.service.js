const mongoose = require("mongoose");
const Availability = require("./calendar-availability.model");
const Meeting = require("../meetings/meeting.model");
const Calendar = require("./calendar.model");
const Activity = require("../activities/activity.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");
const ensure = async (businessId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid business or user ID.");
  const m = await BusinessMember.findOne({ businessId, userId, status: "ACTIVE" });
  if (!m) throw new ApiError(403, "User is not an active member of this business.");
};
const get = async ({ businessId, userId, targetUserId }) => {
  await ensure(businessId, userId);
  return Availability.findOne({ businessId, userId: targetUserId }).lean();
};
const save = async ({ businessId, userId, targetUserId, data }) => {
  await ensure(businessId, userId);
  const payload = {
    businessId,
    userId: targetUserId,
    timezone: data.timezone || "Asia/Kolkata",
    workingDays: Array.isArray(data.workingDays) ? data.workingDays : [1, 2, 3, 4, 5],
    workingHours: data.workingHours || { start: "09:00", end: "18:00" },
    breaks: Array.isArray(data.breaks) ? data.breaks : [],
    updatedBy: userId,
  };
  return Availability.findOneAndUpdate({ businessId, userId: targetUserId }, { $set: payload, $setOnInsert: { createdBy: userId } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
};
const slots = async ({ businessId, userId, targetUserId, from, to }) => {
  await ensure(businessId, userId);
  const start = new Date(from),
    end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new ApiError(400, "Invalid availability range.");
  const availability = await Availability.findOne({ businessId, userId: targetUserId, isActive: true }).lean();
  const [meetings, events, activities] = await Promise.all([
    Meeting.find({ businessId, isDeleted: false, organizerId: targetUserId, startAt: { $lt: end }, endAt: { $gt: start } })
      .select("startAt endAt title")
      .lean(),
    Calendar.find({ businessId, isDeleted: false, organizerId: targetUserId, startAt: { $lt: end }, endAt: { $gt: start } })
      .select("startAt endAt title")
      .lean(),
    Activity.find({ businessId, isDeleted: false, assignedTo: targetUserId, dueAt: { $gte: start, $lte: end } })
      .select("dueAt subject")
      .lean(),
  ]);
  return { availability, conflicts: [...meetings.map((x) => ({ ...x, source: "MEETING" })), ...events.map((x) => ({ ...x, source: "CALENDAR" })), ...activities.map((x) => ({ startAt: x.dueAt, endAt: x.dueAt, title: x.subject, source: "ACTIVITY" }))] };
};
module.exports = { get, save, slots };
