const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const integrationIdValidator = [param("integrationId").trim().notEmpty().withMessage("Integration ID is required").isMongoId().withMessage("Invalid integration ID")];

const integrationTypes = ["EMAIL", "SMS", "WHATSAPP", "PAYMENT", "STORAGE", "CALENDAR", "ACCOUNTING", "MARKETING", "OTHER"];

const integrationStatuses = ["ACTIVE", "INACTIVE", "ERROR", "DISCONNECTED"];

const createIntegrationValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Integration name is required").isLength({ min: 2, max: 150 }).withMessage("Integration name must be between 2 and 150 characters"),

  body("provider").trim().notEmpty().withMessage("Integration provider is required").isLength({ min: 2, max: 100 }).withMessage("Provider must be between 2 and 100 characters"),

  body("type").notEmpty().withMessage("Integration type is required").isIn(integrationTypes).withMessage("Invalid integration type"),

  body("status").optional().isIn(integrationStatuses).withMessage("Invalid integration status"),

  body("config").optional().isObject().withMessage("Config must be an object"),

  body("credentials").optional().isObject().withMessage("Credentials must be an object"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
];

const getIntegrationsValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

  query("provider").optional().trim().isLength({ max: 100 }).withMessage("Provider cannot exceed 100 characters"),

  query("type").optional().isIn(integrationTypes).withMessage("Invalid integration type"),

  query("status").optional().isIn(integrationStatuses).withMessage("Invalid integration status"),
];

const getIntegrationValidator = [...businessIdValidator, ...integrationIdValidator];

const updateIntegrationValidator = [
  ...businessIdValidator,
  ...integrationIdValidator,

  body("name").optional().trim().isLength({ min: 2, max: 150 }).withMessage("Integration name must be between 2 and 150 characters"),

  body("provider").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Provider must be between 2 and 100 characters"),

  body("type").optional().isIn(integrationTypes).withMessage("Invalid integration type"),

  body("status").optional().isIn(integrationStatuses).withMessage("Invalid integration status"),

  body("config").optional().isObject().withMessage("Config must be an object"),

  body("credentials").optional().isObject().withMessage("Credentials must be an object"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object"),

  body("errorMessage").optional({ values: "null" }).trim().isLength({ max: 1000 }).withMessage("Error message cannot exceed 1000 characters"),
];

const updateIntegrationStatusValidator = [
  ...businessIdValidator,
  ...integrationIdValidator,

  body("status").notEmpty().withMessage("Integration status is required").isIn(integrationStatuses).withMessage("Invalid integration status"),

  body("errorMessage").optional({ values: "null" }).trim().isLength({ max: 1000 }).withMessage("Error message cannot exceed 1000 characters"),
];

const deleteIntegrationValidator = [...businessIdValidator, ...integrationIdValidator];

module.exports = {
  businessIdValidator,
  integrationIdValidator,
  createIntegrationValidator,
  getIntegrationsValidator,
  getIntegrationValidator,
  updateIntegrationValidator,
  updateIntegrationStatusValidator,
  deleteIntegrationValidator,
};
