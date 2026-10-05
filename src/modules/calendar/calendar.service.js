const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const Calendar = require("./calendar.model");
const Meeting = require("../meetings/meeting.model");
const Activity = require("../activities/activity.model");
const BusinessMember = require("../business-members/business-member.model");
const { publish } = require("../../events/eventBus");

const validateId = (id, name) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, `Invalid ${name}.`);
};
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dateRange = (startAt, endAt) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) throw new ApiError(400, "Invalid start time.");
  if (Number.isNaN(end.getTime())) throw new ApiError(400, "Invalid end time.");
  if (end <= start) throw new ApiError(400, "End time must be after start time.");
  return { start, end };
};
const ensureMember = async (businessId, userId) => {
  validateId(businessId, "business ID");
  const member = await BusinessMember.findOne({ businessId, userId, status: "ACTIVE" }).lean();
  if (!member) throw new ApiError(403, "You are not an active member of this business.");
  return member;
};
const normalizeAttendees = (items) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items
    .filter(Boolean)
    .map((a) => ({ userId: a.userId || null, email: a.email ? String(a.email).trim().toLowerCase() : null, name: a.name ? String(a.name).trim() : null, response: a.response || "PENDING" }))
    .filter((a) => {
      const key = a.userId ? `u:${a.userId}` : a.email ? `e:${a.email}` : null;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
const validateAttendeeUsers = async (businessId, attendees) => {
  const ids = [
    ...new Set(
      attendees
        .map((a) => a.userId)
        .filter(Boolean)
        .map(String)
    ),
  ];
  if (!ids.length) return;
  ids.forEach((id) => validateId(id, "attendee user ID"));
  const count = await BusinessMember.countDocuments({ businessId, userId: { $in: ids }, status: "ACTIVE" });
  if (count !== ids.length) throw new ApiError(400, "One or more attendees are not active members of this business.");
};
const checkOverlap = async ({ businessId, startAt, endAt, excludeId = null }) => {
  const q = { businessId, isDeleted: false, status: { $nin: ["CANCELLED"] }, startAt: { $lt: endAt }, endAt: { $gt: startAt } };
  if (excludeId) q._id = { $ne: excludeId };
  const [calendarConflict, meetingConflict] = await Promise.all([
    Calendar.findOne(q).select("_id title startAt endAt").lean(),
    Meeting.findOne({ businessId, isDeleted: false, status: { $nin: ["CANCELLED", "NO_SHOW"] }, startAt: { $lt: endAt }, endAt: { $gt: startAt } })
      .select("_id title startAt endAt")
      .lean(),
  ]);
  return calendarConflict || meetingConflict ? { ...(calendarConflict || meetingConflict), source: calendarConflict ? "CALENDAR" : "MEETING" } : null;
};
const list = async ({ businessId, userId, query = {} }) => {
  await ensureMember(businessId, userId);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
  const from = query.from ? new Date(query.from) : new Date("1970-01-01");
  const to = query.to ? new Date(query.to) : new Date("2999-12-31");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new ApiError(400, "Invalid calendar date range.");
  const q = { businessId, isDeleted: false, startAt: { $lt: to }, endAt: { $gt: from } };
  if (query.search) {
    const s = escapeRegex(query.search.trim());
    q.$or = [{ title: { $regex: s, $options: "i" } }, { description: { $regex: s, $options: "i" } }, { location: { $regex: s, $options: "i" } }];
  }
  if (query.type) q.type = query.type;
  if (query.status) q.status = query.status;
  if (query.source) q.source = query.source;
  if (query.organizerId) {
    validateId(query.organizerId, "organizer ID");
    q.organizerId = query.organizerId;
  }
  const includeMeetings = query.includeMeetings !== "false";
  const includeActivities = query.includeActivities !== "false";
  const [events, total, meetings, activities] = await Promise.all([
    Calendar.find(q)
      .sort({ startAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("organizerId", "firstName lastName name email")
      .populate("attendees.userId", "firstName lastName name email")
      .lean(),
    Calendar.countDocuments(q),
    includeMeetings
      ? Meeting.find({ businessId, isDeleted: false, startAt: { $lt: to }, endAt: { $gt: from } })
          .sort({ startAt: 1 })
          .limit(500)
          .populate("organizerId", "firstName lastName name email")
          .populate("attendees.userId", "firstName lastName name email")
          .lean()
      : [],
    includeActivities
      ? Activity.find({ businessId, isDeleted: false, dueAt: { $gte: from, $lte: to } })
          .sort({ dueAt: 1 })
          .limit(500)
          .populate("assignedTo", "firstName lastName name email")
          .lean()
      : [],
  ]);
  const unified = [
    ...events.map((e) => ({ ...e, calendarSource: "CALENDAR" })),
    ...meetings.map((m) => ({ ...m, calendarSource: "MEETING", title: m.title, startAt: m.startAt, endAt: m.endAt, type: "MEETING", status: m.status })),
    ...activities.map((a) => ({ ...a, calendarSource: "ACTIVITY", title: a.subject, startAt: a.dueAt, endAt: a.dueAt, type: a.type, status: a.status })),
  ]
    .filter((e) => e.startAt)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  return { events: unified, calendarEvents: events, meetings, activities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
};
const getById = async ({ businessId, userId, calendarId }) => {
  await ensureMember(businessId, userId);
  validateId(calendarId, "calendar event ID");
  const event = await Calendar.findOne({ _id: calendarId, businessId, isDeleted: false }).populate("organizerId", "firstName lastName name email").populate("attendees.userId", "firstName lastName name email").lean();
  if (!event) throw new ApiError(404, "Calendar event not found.");
  return event;
};
const create = async ({ businessId, userId, data }) => {
  await ensureMember(businessId, userId);
  const { start, end } = dateRange(data.startAt, data.endAt);
  const attendees = normalizeAttendees(data.attendees);
  await validateAttendeeUsers(businessId, attendees);
  const conflict = await checkOverlap({ businessId, startAt: start, endAt: end });
  if (conflict) throw new ApiError(409, `Calendar event overlaps with "${conflict.title}".`);
  const event = await Calendar.create({
    businessId,
    title: data.title,
    description: data.description || null,
    type: data.type || "EVENT",
    status: data.status || "SCHEDULED",
    startAt: start,
    endAt: end,
    allDay: Boolean(data.allDay),
    timezone: data.timezone || "Asia/Kolkata",
    location: data.location || null,
    meetingUrl: data.meetingUrl || null,
    organizerId: userId,
    attendees,
    visibility: data.visibility || "BUSINESS",
    source: "INTERNAL",
    relatedTo: data.relatedTo || undefined,
    reminders: Array.isArray(data.reminders) ? data.reminders : [],
    recurrence: data.recurrence || undefined,
    color: data.color || null,
    metadata: data.metadata || {},
    createdBy: userId,
  });
  await publish("calendar.created", { businessId, entity: "CALENDAR", entityId: event._id.toString(), record: event.toObject(), actorId: userId });
  return event;
};
const update = async ({ businessId, userId, calendarId, data }) => {
  await ensureMember(businessId, userId);
  validateId(calendarId, "calendar event ID");
  const event = await Calendar.findOne({ _id: calendarId, businessId, isDeleted: false });
  if (!event) throw new ApiError(404, "Calendar event not found.");
  const start = data.startAt !== undefined ? new Date(data.startAt) : event.startAt;
  const end = data.endAt !== undefined ? new Date(data.endAt) : event.endAt;
  const range = dateRange(start, end);
  if (data.startAt !== undefined || data.endAt !== undefined || data.status !== undefined) {
    const conflict = await checkOverlap({ businessId, startAt: range.start, endAt: range.end, excludeId: event._id });
    if (conflict && data.status !== "CANCELLED") throw new ApiError(409, `Calendar event overlaps with "${conflict.title}".`);
  }
  if (data.attendees !== undefined) {
    const attendees = normalizeAttendees(data.attendees);
    await validateAttendeeUsers(businessId, attendees);
    event.attendees = attendees;
  }
  const fields = ["title", "description", "type", "status", "allDay", "timezone", "location", "meetingUrl", "visibility", "relatedTo", "reminders", "recurrence", "color", "metadata"];
  for (const key of fields) if (data[key] !== undefined) event[key] = data[key];
  event.startAt = range.start;
  event.endAt = range.end;
  event.updatedBy = userId;
  await event.save();
  await publish("calendar.updated", { businessId, entity: "CALENDAR", entityId: event._id.toString(), record: event.toObject(), actorId: userId });
  return event;
};
const remove = async ({ businessId, userId, calendarId }) => {
  await ensureMember(businessId, userId);
  validateId(calendarId, "calendar event ID");
  const event = await Calendar.findOne({ _id: calendarId, businessId, isDeleted: false });
  if (!event) throw new ApiError(404, "Calendar event not found.");
  event.isDeleted = true;
  event.deletedAt = new Date();
  event.deletedBy = userId;
  event.updatedBy = userId;
  await event.save();
  await publish("calendar.deleted", { businessId, entity: "CALENDAR", entityId: event._id.toString(), record: event.toObject(), actorId: userId });
  return event;
};
module.exports = { list, getById, create, update, remove, ensureMember, validateId, checkOverlap };
