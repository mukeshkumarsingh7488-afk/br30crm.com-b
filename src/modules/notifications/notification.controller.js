const notificationService = require("./notification.service");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  return res.status(201).json(new ApiResponse(201, notification, "Notification created successfully"));
});

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications({
    businessId: req.params.businessId,
    userId: req.user.userId,
    recipientId: req.query.recipientId,
    status: req.query.status,
    type: req.query.type,
    priority: req.query.priority,
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json(new ApiResponse(200, result, "Notifications fetched successfully"));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount({
    businessId: req.params.businessId,
    userId: req.user.userId,
    recipientId: req.query.recipientId,
  });

  return res.status(200).json(new ApiResponse(200, result, "Unread notification count fetched successfully"));
});

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    notificationId: req.params.notificationId,
  });

  return res.status(200).json(new ApiResponse(200, notification, "Notification fetched successfully"));
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead({
    businessId: req.params.businessId,
    userId: req.user.userId,
    notificationId: req.params.notificationId,
  });

  return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead({
    businessId: req.params.businessId,
    userId: req.user.userId,
  });

  return res.status(200).json(new ApiResponse(200, result, "All notifications marked as read"));
});

const archiveNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.archiveNotification({
    businessId: req.params.businessId,
    userId: req.user.userId,
    notificationId: req.params.notificationId,
  });

  return res.status(200).json(new ApiResponse(200, notification, "Notification archived successfully"));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification({
    businessId: req.params.businessId,
    userId: req.user.userId,
    notificationId: req.params.notificationId,
  });

  return res.status(200).json(new ApiResponse(200, notification, "Notification deleted successfully"));
});

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
