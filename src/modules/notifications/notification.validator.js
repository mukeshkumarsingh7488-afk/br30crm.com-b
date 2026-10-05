const { body, param, query } = require("express-validator");

const validateObjectId = (field) => param(field).isMongoId().withMessage(`${field} must be a valid ID`);

const notificationIdValidator = [validateObjectId("businessId"), validateObjectId("notificationId")];

const createNotificationValidator = [
  validateObjectId("businessId"),

  body("recipientId").optional().isMongoId().withMessage("recipientId must be a valid ID"),

  body("type").optional().isIn(["SYSTEM", "LEAD", "CONTACT", "COMPANY", "DEAL", "TASK", "ACTIVITY", "AUTOMATION", "WEBHOOK", "INTEGRATION", "SECURITY", "OTHER"]).withMessage("Invalid notification type"),

  body("title").trim().notEmpty().withMessage("Notification title is required").isLength({ max: 200 }).withMessage("Notification title cannot exceed 200 characters"),

  body("message").trim().notEmpty().withMessage("Notification message is required").isLength({ max: 2000 }).withMessage("Notification message cannot exceed 2000 characters"),

  body("priority").optional().isIn(["LOW", "NORMAL", "HIGH", "URGENT"]).withMessage("Invalid notification priority"),

  body("actionUrl").optional({ nullable: true }).isString().withMessage("actionUrl must be a string").isLength({ max: 1000 }).withMessage("actionUrl cannot exceed 1000 characters"),

  body("entityType").optional({ nullable: true }).isString().withMessage("entityType must be a string").isLength({ max: 100 }).withMessage("entityType cannot exceed 100 characters"),

  body("entityId").optional({ nullable: true }).isMongoId().withMessage("entityId must be a valid ID"),

  body("metadata").optional().isObject().withMessage("metadata must be an object"),

  body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("expiresAt must be a valid date"),
];

const listNotificationValidator = [
  validateObjectId("businessId"),

  query("recipientId").optional().isMongoId().withMessage("recipientId must be a valid ID"),

  query("status").optional().isIn(["UNREAD", "READ", "ARCHIVED"]).withMessage("Invalid notification status"),

  query("type").optional().isIn(["SYSTEM", "LEAD", "CONTACT", "COMPANY", "DEAL", "TASK", "ACTIVITY", "AUTOMATION", "WEBHOOK", "INTEGRATION", "SECURITY", "OTHER"]).withMessage("Invalid notification type"),

  query("priority").optional().isIn(["LOW", "NORMAL", "HIGH", "URGENT"]).withMessage("Invalid notification priority"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const unreadCountValidator = [validateObjectId("businessId"), query("recipientId").optional().isMongoId().withMessage("recipientId must be a valid ID")];

module.exports = {
  createNotificationValidator,
  listNotificationValidator,
  notificationIdValidator,
  unreadCountValidator,
};
