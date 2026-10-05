const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const validate = require("../../middleware/validation");

const notificationController = require("./notification.controller");

const { createNotificationValidator, listNotificationValidator, notificationIdValidator, unreadCountValidator } = require("./notification.validator");

router.use(auth);

router.post("/business/:businessId", createNotificationValidator, validate, requireBusinessMembership, requirePermission("notifications.create"), notificationController.createNotification);

router.get("/business/:businessId", listNotificationValidator, validate, requireBusinessMembership, requirePermission("notifications.view"), notificationController.getNotifications);

router.get("/business/:businessId/unread-count", unreadCountValidator, validate, requireBusinessMembership, requirePermission("notifications.view"), notificationController.getUnreadCount);

router.get("/business/:businessId/:notificationId", notificationIdValidator, validate, requireBusinessMembership, requirePermission("notifications.view"), notificationController.getNotificationById);

router.patch("/business/:businessId/:notificationId/read", notificationIdValidator, validate, requireBusinessMembership, requirePermission("notifications.update"), notificationController.markAsRead);

router.patch("/business/:businessId/read-all", unreadCountValidator, validate, requireBusinessMembership, requirePermission("notifications.update"), notificationController.markAllAsRead);

router.patch("/business/:businessId/:notificationId/archive", notificationIdValidator, validate, requireBusinessMembership, requirePermission("notifications.update"), notificationController.archiveNotification);

router.delete("/business/:businessId/:notificationId", notificationIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("notifications.delete"), notificationController.deleteNotification);

module.exports = router;
