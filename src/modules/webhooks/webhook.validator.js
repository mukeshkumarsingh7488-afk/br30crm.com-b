const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const webhookIdValidator = [param("webhookId").trim().notEmpty().withMessage("Webhook ID is required").isMongoId().withMessage("Invalid webhook ID")];

const webhookStatuses = ["ACTIVE", "INACTIVE", "FAILED"];

const isValidWebhookUrl = (value) => {
  try {
    const parsedUrl = new URL(value);

    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

const createWebhookValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Webhook name is required").isLength({ min: 2, max: 150 }).withMessage("Webhook name must be between 2 and 150 characters"),

  body("url")
    .trim()
    .notEmpty()
    .withMessage("Webhook URL is required")
    .isLength({ max: 2000 })
    .withMessage("Webhook URL cannot exceed 2000 characters")
    .custom((value) => {
      if (!isValidWebhookUrl(value)) {
        throw new Error("Webhook URL must be a valid HTTP or HTTPS URL");
      }

      return true;
    }),

  body("events").isArray({ min: 1 }).withMessage("At least one webhook event is required"),

  body("events.*").trim().notEmpty().withMessage("Webhook event cannot be empty").isLength({ max: 100 }).withMessage("Webhook event cannot exceed 100 characters"),

  body("status").optional().isIn(webhookStatuses).withMessage("Invalid webhook status"),

  body("headers").optional().isObject().withMessage("Headers must be an object"),

  body("retryEnabled").optional().isBoolean().withMessage("retryEnabled must be a boolean").toBoolean(),

  body("maxRetries").optional().isInt({ min: 0, max: 10 }).withMessage("Max retries must be between 0 and 10").toInt(),

  body("timeoutMs").optional().isInt({ min: 1000, max: 120000 }).withMessage("Timeout must be between 1000 and 120000 milliseconds").toInt(),
];

const getWebhooksValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

  query("status").optional().isIn(webhookStatuses).withMessage("Invalid webhook status"),

  query("event").optional().trim().isLength({ max: 100 }).withMessage("Event cannot exceed 100 characters"),
];

const getWebhookValidator = [...businessIdValidator, ...webhookIdValidator];

const updateWebhookValidator = [
  ...businessIdValidator,
  ...webhookIdValidator,

  body("name").optional().trim().isLength({ min: 2, max: 150 }).withMessage("Webhook name must be between 2 and 150 characters"),

  body("url")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Webhook URL cannot exceed 2000 characters")
    .custom((value) => {
      if (!isValidWebhookUrl(value)) {
        throw new Error("Webhook URL must be a valid HTTP or HTTPS URL");
      }

      return true;
    }),

  body("events").optional().isArray({ min: 1 }).withMessage("At least one webhook event is required"),

  body("events.*").optional().trim().notEmpty().withMessage("Webhook event cannot be empty").isLength({ max: 100 }).withMessage("Webhook event cannot exceed 100 characters"),

  body("status").optional().isIn(webhookStatuses).withMessage("Invalid webhook status"),

  body("headers").optional().isObject().withMessage("Headers must be an object"),

  body("retryEnabled").optional().isBoolean().withMessage("retryEnabled must be a boolean").toBoolean(),

  body("maxRetries").optional().isInt({ min: 0, max: 10 }).withMessage("Max retries must be between 0 and 10").toInt(),

  body("timeoutMs").optional().isInt({ min: 1000, max: 120000 }).withMessage("Timeout must be between 1000 and 120000 milliseconds").toInt(),
];

const regenerateWebhookSecretValidator = [...businessIdValidator, ...webhookIdValidator];

const deleteWebhookValidator = [...businessIdValidator, ...webhookIdValidator];
const deliveryIdValidator = [...businessIdValidator, param("deliveryId").trim().notEmpty().isMongoId().withMessage("Invalid delivery ID")];
const deliveryListValidator = [...businessIdValidator, ...webhookIdValidator, query("page").optional().isInt({ min: 1 }).toInt(), query("limit").optional().isInt({ min: 1, max: 100 }).toInt(), query("status").optional().isIn(["PENDING", "SUCCESS", "FAILED"])];

module.exports = {
  businessIdValidator,
  webhookIdValidator,
  createWebhookValidator,
  getWebhooksValidator,
  getWebhookValidator,
  updateWebhookValidator,
  regenerateWebhookSecretValidator,
  deleteWebhookValidator,
  deliveryIdValidator,
  deliveryListValidator,
};
