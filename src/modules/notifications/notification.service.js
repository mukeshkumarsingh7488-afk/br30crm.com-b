const mongoose = require("mongoose");
const Notification = require("./notification.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const User = require("../users/user.model");
const Team = require("../teams/team.model");
const Automation = require("../automations/automation.model");
const ApiError = require("../../utils/ApiError");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateBusiness = async (businessId) => {
  if (!isValidObjectId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }

  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  if (business.status && business.status !== "ACTIVE") {
    throw new ApiError(400, "Business is not active");
  }

  return business;
};

const validateMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).select("_id");

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return member;
};

const validateRecipient = async (businessId, recipientId) => {
  if (!isValidObjectId(recipientId)) {
    throw new ApiError(400, "Invalid recipient ID");
  }

  const recipient = await BusinessMember.findOne({
    businessId,
    userId: recipientId,
    status: "ACTIVE",
  }).select("_id userId");

  if (!recipient) {
    throw new ApiError(400, "Recipient is not an active member of this business");
  }

  return recipient;
};

const createNotification = async ({ businessId, userId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const recipientId = data.recipientId || userId;

  await validateRecipient(businessId, recipientId);

  const creator = await User.findById(userId).select("name firstName lastName email").lean();
  const member = await BusinessMember.findOne({ businessId, userId, status: "ACTIVE" })
    .populate("roleId", "name slug")
    .lean();
  const creatorName = creator?.name || [creator?.firstName, creator?.lastName].filter(Boolean).join(" ").trim() || creator?.email || null;

  const notification = await Notification.create({
    businessId,
    recipientId,
    type: data.type || "SYSTEM",
    title: data.title,
    message: data.message,
    priority: data.priority || "NORMAL",
    status: "UNREAD",
    actionUrl: data.actionUrl || null,
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    source: {
      type: "USER",
      id: userId,
      name: creatorName,
      email: creator?.email || null,
      role: member?.roleId?.name || member?.roleId?.slug || null,
    },
    metadata: data.metadata || {},
    expiresAt: data.expiresAt || null,
    createdBy: userId,
  });

  return notification;
};

const getNotifications = async ({ businessId, userId, recipientId, status, type, priority, page = 1, limit = 20 }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
    recipientId: recipientId || userId,
  };

  if (!isValidObjectId(filter.recipientId)) {
    throw new ApiError(400, "Invalid recipient ID");
  }

  await validateRecipient(businessId, filter.recipientId);

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (priority) {
    filter.priority = priority;
  }

  filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

  const skip = (pageNumber - 1) * limitNumber;

  const [notifications, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).populate("createdBy", "name firstName lastName email").lean(), Notification.countDocuments(filter)]);

  const actorIds = notifications
    .map((item) => item?.source?.id || item?.metadata?.actorId || item?.createdBy?._id)
    .filter(Boolean)
    .map(String);
  const uniqueActorIds = [...new Set(actorIds)];
  const [actors, members] = await Promise.all([
    uniqueActorIds.length ? User.find({ _id: { $in: uniqueActorIds } }).select("name firstName lastName email").lean() : [],
    uniqueActorIds.length
      ? BusinessMember.find({ businessId, userId: { $in: uniqueActorIds }, status: "ACTIVE" })
          .populate("roleId", "name slug")
          .lean()
      : [],
  ]);
  const actorByUser = new Map(actors.map((item) => [String(item._id), item]));
  const memberByUser = new Map(members.map((item) => [String(item.userId), item]));

  const teamIds = notifications.filter((item) => item?.source?.type === "TEAM" && item?.source?.id).map((item) => item.source.id);
  const teams = teamIds.length ? await Team.find({ _id: { $in: teamIds }, businessId }).select("name slug").lean() : [];
  const teamById = new Map(teams.map((item) => [String(item._id), item]));

  const automationIds = notifications
    .filter((item) => item?.source?.type === "AUTOMATION" ? item?.source?.id : item?.metadata?.automationId)
    .map((item) => item?.source?.id || item?.metadata?.automationId)
    .filter(Boolean);
  const automations = automationIds.length ? await Automation.find({ _id: { $in: automationIds }, businessId }).select("name").lean() : [];
  const automationById = new Map(automations.map((item) => [String(item._id), item]));

  const enrichedNotifications = notifications.map((item) => {
    const source = item.source || {};
    const creator = item.createdBy || null;
    const sourceActorId = source.id || item?.metadata?.actorId || creator?._id || null;
    const actor = sourceActorId ? actorByUser.get(String(sourceActorId)) || creator : creator;
    const member = sourceActorId ? memberByUser.get(String(sourceActorId)) : null;
    const team = source.type === "TEAM" && source.id ? teamById.get(String(source.id)) : null;

    const automationId = source.type === "AUTOMATION" ? source.id : item?.metadata?.automationId;
    if (automationId) {
      const automation = automationById.get(String(automationId));
      item.source = {
        type: "AUTOMATION",
        id: automationId,
        name: source.name || automation?.name || "Automation",
        email: null,
        role: null,
      };
      return item;
    }

    item.source = {
      type: source.type || "BUSINESS_MEMBER",
      id: source.id || sourceActorId || null,
      name: source.name || actor?.name || [actor?.firstName, actor?.lastName].filter(Boolean).join(" ").trim() || actor?.email || team?.name || null,
      email: source.email || actor?.email || null,
      role: source.role || member?.roleId?.name || member?.roleId?.slug || null,
    };

    return item;
  });

  return {
    notifications: enrichedNotifications,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const getUnreadCount = async ({ businessId, userId, recipientId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const targetRecipientId = recipientId || userId;

  if (!isValidObjectId(targetRecipientId)) {
    throw new ApiError(400, "Invalid recipient ID");
  }

  await validateRecipient(businessId, targetRecipientId);

  const filter = {
    businessId,
    recipientId: targetRecipientId,
    status: "UNREAD",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  const count = await Notification.countDocuments(filter);

  return {
    count,
  };
};

const getNotificationById = async ({ businessId, userId, notificationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    businessId,
    recipientId: userId,
  }).populate("createdBy", "name firstName lastName email").lean();

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification?.source?.type === "AUTOMATION" || notification?.metadata?.automationId) {
    const automationId = notification?.source?.id || notification?.metadata?.automationId;
    const automation = await Automation.findOne({ _id: automationId, businessId }).select("name").lean();
    notification.source = {
      type: "AUTOMATION",
      id: automationId,
      name: notification?.source?.name || automation?.name || "Automation",
      email: null,
      role: null,
    };
  } else {
    const sourceActorId = notification?.source?.id || notification?.metadata?.actorId || notification?.createdBy?._id || null;
    const actor = sourceActorId
      ? await User.findById(sourceActorId).select("name firstName lastName email").lean()
      : notification?.createdBy || null;
    const member = sourceActorId
      ? await BusinessMember.findOne({ businessId, userId: sourceActorId, status: "ACTIVE" }).populate("roleId", "name slug").lean()
      : null;
    notification.source = {
      type: notification?.source?.type || "USER",
      id: sourceActorId,
      name: notification?.source?.name || actor?.name || [actor?.firstName, actor?.lastName].filter(Boolean).join(" ").trim() || actor?.email || "Business member",
      email: notification?.source?.email || actor?.email || null,
      role: notification?.source?.role || member?.roleId?.name || member?.roleId?.slug || null,
    };
  }

  return notification;
};

const markAsRead = async ({ businessId, userId, notificationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    businessId,
    recipientId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.status = "READ";
  notification.readAt = new Date();

  await notification.save();

  return notification;
};

const markAllAsRead = async ({ businessId, userId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const result = await Notification.updateMany(
    {
      businessId,
      recipientId: userId,
      status: "UNREAD",
    },
    {
      $set: {
        status: "READ",
        readAt: new Date(),
      },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};

const archiveNotification = async ({ businessId, userId, notificationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    businessId,
    recipientId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.status = "ARCHIVED";
  notification.archivedAt = new Date();

  await notification.save();

  return notification;
};

const deleteNotification = async ({ businessId, userId, notificationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    businessId,
    recipientId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
};
