const { body, param, query } = require("express-validator");

const businessId = param("businessId").isMongoId().withMessage("Invalid business ID.");

const leadId = param("leadId").isMongoId().withMessage("Invalid lead ID.");

const attributionId = param("attributionId").isMongoId().withMessage("Invalid attribution ID.");

const optionalObjectId = (field) => body(field).optional({ nullable: true }).isMongoId().withMessage(`${field} must be a valid ID.`);

const optionalString = (field, max, message) =>
  body(field)
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max })
    .withMessage(message || `${field} is too long.`);

const allowedTouchTypes = ["FIRST", "LAST", "FORM", "QR", "DIRECT"];

const allowedAttributionTypes = ["FIRST_TOUCH", "LAST_TOUCH", "FORM_SUBMISSION", "QR_SCAN", "MANUAL"];

exports.lead = [businessId, leadId];

exports.byId = [businessId, attributionId];

exports.create = [
  businessId,
  leadId,

  optionalObjectId("formId"),
  optionalObjectId("sourceId"),
  optionalObjectId("campaignId"),
  optionalObjectId("qrCodeId"),

  optionalString("source", 150, "Source is too long."),

  optionalString("medium", 150, "Medium is too long."),

  optionalString("campaign", 200, "Campaign is too long."),

  optionalString("term", 200, "Term is too long."),

  optionalString("content", 200, "Content is too long."),

  optionalString("referrer", 2000, "Referrer is too long."),

  optionalString("landingPage", 2000, "Landing page is too long."),

  optionalString("landingUrl", 3000, "Landing URL is too long."),

  optionalString("userAgent", 2000, "User agent is too long."),

  optionalString("ipAddress", 100, "IP address is too long."),

  optionalString("trackingId", 200, "Tracking ID is too long."),

  body("touchType").optional().isIn(allowedTouchTypes).withMessage("Invalid touch type."),

  body("attributionType").optional().isIn(allowedAttributionTypes).withMessage("Invalid attribution type."),

  body("capturedAt").optional({ nullable: true }).isISO8601().withMessage("capturedAt must be a valid date."),

  body("metadata").optional().isObject().withMessage("metadata must be an object."),
];

exports.update = [
  businessId,
  attributionId,

  optionalObjectId("formId"),
  optionalObjectId("sourceId"),
  optionalObjectId("campaignId"),
  optionalObjectId("qrCodeId"),

  optionalString("source", 150, "Source is too long."),

  optionalString("medium", 150, "Medium is too long."),

  optionalString("campaign", 200, "Campaign is too long."),

  optionalString("term", 200, "Term is too long."),

  optionalString("content", 200, "Content is too long."),

  optionalString("referrer", 2000, "Referrer is too long."),

  optionalString("landingPage", 2000, "Landing page is too long."),

  optionalString("landingUrl", 3000, "Landing URL is too long."),

  optionalString("userAgent", 2000, "User agent is too long."),

  optionalString("ipAddress", 100, "IP address is too long."),

  optionalString("trackingId", 200, "Tracking ID is too long."),

  body("touchType").optional().isIn(allowedTouchTypes).withMessage("Invalid touch type."),

  body("attributionType").optional().isIn(allowedAttributionTypes).withMessage("Invalid attribution type."),

  body("metadata").optional().isObject().withMessage("metadata must be an object."),
];

exports.summary = [
  businessId,

  query("source").optional().isString().trim().isLength({ max: 150 }),

  query("campaign").optional().isString().trim().isLength({ max: 200 }),

  query("formId").optional().isMongoId().withMessage("Invalid form ID."),

  query("from").optional().isISO8601().withMessage("Invalid from date."),

  query("to").optional().isISO8601().withMessage("Invalid to date."),
];
