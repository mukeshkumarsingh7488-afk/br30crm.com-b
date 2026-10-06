const mongoose = require("mongoose");

const Meeting = require("./meeting.model");
const BusinessMember = require("../business-members/business-member.model");

const ApiError = require("../../utils/ApiError");

const ensure = async (businessId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    throw new ApiError(400, "Invalid business ID.");
  }

  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).lean();

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business.");
  }

  return member;
};

const validateDateRange = (startAt, endAt) => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime())) {
    throw new ApiError(400, "Invalid meeting start time.");
  }

  if (Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid meeting end time.");
  }

  if (end <= start) {
    throw new ApiError(400, "Meeting end time must be after start time.");
  }

  return { start, end };
};

const checkOverlap = async ({ businessId, startAt, endAt, meetingId = null }) => {
  const query = {
    businessId,
    isDeleted: false,
    status: { $nin: ["CANCELLED", "NO_SHOW"] },

    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (meetingId) {
    query._id = { $ne: meetingId };
  }

  const conflict = await Meeting.findOne(query).select("_id title startAt endAt organizerId").lean();

  return conflict;
};

const normalizeAttendees = (attendees) => {
  if (!Array.isArray(attendees)) {
    return [];
  }

  const unique = new Map();

  for (const attendee of attendees) {
    if (!attendee) continue;

    const userId = attendee.userId || null;
    const email = attendee.email ? String(attendee.email).trim().toLowerCase() : null;

    const key = userId ? `user:${userId}` : email ? `email:${email}` : null;

    if (!key) continue;

    if (!unique.has(key)) {
      unique.set(key, {
        userId,
        email,
        name: attendee.name ? String(attendee.name).trim() : null,
        response: attendee.response || "PENDING",
      });
    }
  }

  return Array.from(unique.values());
};

const list = async ({ businessId, userId, from, to, status, search, organizerId, relatedType, relatedId, page = 1, limit = 50 }) => {
  await ensure(businessId, userId);

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const query = {
    businessId,
    isDeleted: false,
  };

  if (from || to) {
    query.startAt = {};

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        throw new ApiError(400, "Invalid from date.");
      }

      query.startAt.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        throw new ApiError(400, "Invalid to date.");
      }

      query.startAt.$lte = toDate;
    }
  }

  if (status) {
    query.status = status;
  }

  if (organizerId) {
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      throw new ApiError(400, "Invalid organizer ID.");
    }

    query.organizerId = organizerId;
  }

  if (relatedType) {
    query["relatedTo.type"] = relatedType;
  }

  if (relatedId) {
    if (!mongoose.Types.ObjectId.isValid(relatedId)) {
      throw new ApiError(400, "Invalid related entity ID.");
    }

    query["relatedTo.id"] = relatedId;
  }

  if (search && String(search).trim()) {
    const safeSearch = String(search).trim();

    query.$or = [{ title: { $regex: safeSearch, $options: "i" } }, { description: { $regex: safeSearch, $options: "i" } }, { location: { $regex: safeSearch, $options: "i" } }, { meetingUrl: { $regex: safeSearch, $options: "i" } }];
  }

  const skip = (currentPage - 1) * perPage;

  const [meetings, total] = await Promise.all([
    Meeting.find(query)
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(perPage)
      .populate("organizerId", "firstName lastName name email")
      .populate("attendees.userId", "firstName lastName name email")
      .populate("createdBy", "firstName lastName name email")
      .populate("updatedBy", "firstName lastName name email")
      .lean(),

    Meeting.countDocuments(query),
  ]);

  return {
    meetings,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      hasNextPage: currentPage * perPage < total,
      hasPreviousPage: currentPage > 1,
    },
  };
};

const getById = async ({ businessId, userId, meetingId }) => {
  await ensure(businessId, userId);

  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw new ApiError(400, "Invalid meeting ID.");
  }

  const meeting = await Meeting.findOne({
    _id: meetingId,
    businessId,
    isDeleted: false,
  })
    .populate("organizerId", "firstName lastName name email")
    .populate("attendees.userId", "firstName lastName name email")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email")
    .lean();

  if (!meeting) {
    throw new ApiError(404, "Meeting not found.");
  }

  return meeting;
};

const create = async ({ businessId, userId, data }) => {
  await ensure(businessId, userId);

  const { start, end } = validateDateRange(data.startAt, data.endAt);

  const conflict = await checkOverlap({
    businessId,
    startAt: start,
    endAt: end,
  });

  if (conflict) {
    throw new ApiError(409, `Meeting overlaps with "${conflict.title}".`);
  }

  const attendees = normalizeAttendees(data.attendees);

  const meeting = await Meeting.create({
    businessId,

    title: data.title,

    description: data.description || "",

    startAt: start,

    endAt: end,

    timezone: data.timezone || "Asia/Kolkata",

    location: data.location || null,

    meetingUrl: data.meetingUrl || null,

    status: "SCHEDULED",

    organizerId: userId,

    attendees,

    relatedTo: data.relatedTo || undefined,

    reminders: data.reminders || [],

    outcome: null,

    cancellationReason: null,

    notes: data.notes || null,

    metadata: data.metadata || {},

    createdBy: userId,
  });

  return meeting;
};

const update = async ({ businessId, userId, meetingId, data }) => {
  await ensure(businessId, userId);

  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw new ApiError(400, "Invalid meeting ID.");
  }

  const meeting = await Meeting.findOne({
    _id: meetingId,
    businessId,
    isDeleted: false,
  });

  if (!meeting) {
    throw new ApiError(404, "Meeting not found.");
  }

  let start = meeting.startAt;
  let end = meeting.endAt;

  if (data.startAt !== undefined) {
    start = new Date(data.startAt);

    if (Number.isNaN(start.getTime())) {
      throw new ApiError(400, "Invalid meeting start time.");
    }
  }

  if (data.endAt !== undefined) {
    end = new Date(data.endAt);

    if (Number.isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid meeting end time.");
    }
  }

  if (end <= start) {
    throw new ApiError(400, "Meeting end time must be after start time.");
  }

  if (data.startAt !== undefined || data.endAt !== undefined || data.status !== undefined) {
    const effectiveStatus = data.status !== undefined ? data.status : meeting.status;

    if (!["CANCELLED", "NO_SHOW"].includes(effectiveStatus)) {
      const conflict = await checkOverlap({
        businessId,
        startAt: start,
        endAt: end,
        meetingId,
      });

      if (conflict) {
        throw new ApiError(409, `Meeting overlaps with "${conflict.title}".`);
      }
    }
  }

  const allowedFields = ["title", "description", "timezone", "location", "meetingUrl", "status", "relatedTo", "reminders", "metadata", "outcome", "cancellationReason", "notes"];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      meeting[key] = data[key];
    }
  }

  if (data.attendees !== undefined) {
    meeting.attendees = normalizeAttendees(data.attendees);
  }

  meeting.startAt = start;
  meeting.endAt = end;

  if (meeting.status === "COMPLETED" && !meeting.outcome) {
    meeting.outcome = data.outcome || meeting.outcome;
  }

  meeting.updatedBy = userId;

  await meeting.save();

  return meeting;
};

const remove = async ({ businessId, userId, meetingId }) => {
  await ensure(businessId, userId);

  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    throw new ApiError(400, "Invalid meeting ID.");
  }

  const meeting = await Meeting.findOne({
    _id: meetingId,
    businessId,
    isDeleted: false,
  });

  if (!meeting) {
    throw new ApiError(404, "Meeting not found.");
  }

  meeting.isDeleted = true;
  meeting.deletedAt = new Date();
  meeting.deletedBy = userId;
  meeting.updatedBy = userId;

  await meeting.save();

  return meeting;
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
