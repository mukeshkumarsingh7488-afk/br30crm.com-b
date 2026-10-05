const { param, body } = require("express-validator");
const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const businessIdValidator = [param("businessId").custom(isObjectId).withMessage("Invalid business ID")];

const settingsBodyValidator = [
  body().custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Settings data must be an object");
    }

    return true;
  }),

  body("general").optional().isObject().withMessage("General settings must be an object"),

  body("general.businessName").optional().trim().isLength({ max: 200 }).withMessage("Business name cannot exceed 200 characters"),

  body("general.legalName").optional().trim().isLength({ max: 250 }).withMessage("Legal name cannot exceed 250 characters"),

  body("general.description").optional().trim().isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("general.website").optional().trim().isLength({ max: 500 }).withMessage("Website cannot exceed 500 characters"),

  body("general.logoUrl").optional().trim().isLength({ max: 1000 }).withMessage("Logo URL cannot exceed 1000 characters"),

  body("general.phone").optional().trim().isLength({ max: 50 }).withMessage("Phone cannot exceed 50 characters"),

  body("general.email").optional().trim().isEmail().withMessage("Invalid business email"),

  body("general.address").optional().trim().isLength({ max: 1000 }).withMessage("Address cannot exceed 1000 characters"),

  body("regional").optional().isObject().withMessage("Regional settings must be an object"),

  body("regional.timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters"),

  body("regional.currency").optional().trim().isLength({ min: 3, max: 10 }).withMessage("Invalid currency"),

  body("regional.dateFormat").optional().trim().isLength({ max: 30 }).withMessage("Date format cannot exceed 30 characters"),

  body("regional.timeFormat").optional().isIn(["12h", "24h"]).withMessage("Time format must be 12h or 24h"),

  body("regional.language").optional().trim().isLength({ max: 20 }).withMessage("Language cannot exceed 20 characters"),

  body("regional.country").optional().trim().isLength({ max: 100 }).withMessage("Country cannot exceed 100 characters"),

  body("notifications").optional().isObject().withMessage("Notifications settings must be an object"),

  body("notifications.emailEnabled").optional().isBoolean().withMessage("emailEnabled must be boolean"),

  body("notifications.pushEnabled").optional().isBoolean().withMessage("pushEnabled must be boolean"),

  body("notifications.smsEnabled").optional().isBoolean().withMessage("smsEnabled must be boolean"),

  body("notifications.inAppEnabled").optional().isBoolean().withMessage("inAppEnabled must be boolean"),

  body("notifications.leadNotifications").optional().isBoolean().withMessage("leadNotifications must be boolean"),

  body("notifications.dealNotifications").optional().isBoolean().withMessage("dealNotifications must be boolean"),

  body("notifications.taskNotifications").optional().isBoolean().withMessage("taskNotifications must be boolean"),

  body("notifications.activityNotifications").optional().isBoolean().withMessage("activityNotifications must be boolean"),

  body("notifications.automationNotifications").optional().isBoolean().withMessage("automationNotifications must be boolean"),

  body("notifications.securityNotifications").optional().isBoolean().withMessage("securityNotifications must be boolean"),

  body("security").optional().isObject().withMessage("Security settings must be an object"),

  body("security.sessionTimeoutMinutes").optional().isInt({ min: 5, max: 43200 }).withMessage("Session timeout must be between 5 and 43200 minutes"),

  body("security.maxLoginAttempts").optional().isInt({ min: 1, max: 20 }).withMessage("Max login attempts must be between 1 and 20"),

  body("security.requireStrongPassword").optional().isBoolean().withMessage("requireStrongPassword must be boolean"),

  body("security.requireTwoFactor").optional().isBoolean().withMessage("requireTwoFactor must be boolean"),

  body("security.allowMultipleSessions").optional().isBoolean().withMessage("allowMultipleSessions must be boolean"),

  body("crm").optional().isObject().withMessage("CRM settings must be an object"),

  body("crm.defaultLeadStatus").optional().trim().isLength({ max: 100 }).withMessage("Default lead status cannot exceed 100 characters"),

  body("crm.defaultDealStage").optional().trim().isLength({ max: 100 }).withMessage("Default deal stage cannot exceed 100 characters"),

  body("crm.defaultPageSize").optional().isInt({ min: 5, max: 100 }).withMessage("Default page size must be between 5 and 100"),

  body("crm.autoAssignLeads").optional().isBoolean().withMessage("autoAssignLeads must be boolean"),

  body("crm.autoCreateActivities").optional().isBoolean().withMessage("autoCreateActivities must be boolean"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
];

module.exports = {
  businessIdValidator,
  settingsBodyValidator,
};
