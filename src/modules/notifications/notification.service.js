const mongoose = require("mongoose");
const Notification = require("./notification.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
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

  const [notifications, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).populate("createdBy", "name email").lean(), Notification.countDocuments(filter)]);

  return {
    notifications,
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
  }).populate("createdBy", "name email");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
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
