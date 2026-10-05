const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const apiKeyIdValidator = [param("apiKeyId").trim().notEmpty().withMessage("API key ID is required").isMongoId().withMessage("Invalid API key ID")];

const createApiKeyValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("API key name is required").isLength({ min: 2, max: 100 }).withMessage("API key name must be between 2 and 100 characters"),

  body("expiresAt")
    .optional({ values: "null" })
    .isISO8601()
    .withMessage("Invalid expiration date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiration date must be in the future");
      }

      return true;
    }),
];

const getApiKeysValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

  query("status").optional().isIn(["ACTIVE", "INACTIVE", "REVOKED"]).withMessage("Invalid API key status"),
];

const getApiKeyValidator = [...businessIdValidator, ...apiKeyIdValidator];

const updateApiKeyValidator = [
  ...businessIdValidator,
  ...apiKeyIdValidator,

  body("name").optional().trim().isLength({ min: 2, max: 100 }).withMessage("API key name must be between 2 and 100 characters"),

  body("expiresAt")
    .optional({ values: "null" })
    .isISO8601()
    .withMessage("Invalid expiration date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expiration date must be in the future");
      }

      return true;
    }),

  body("status").optional().isIn(["ACTIVE", "INACTIVE", "REVOKED"]).withMessage("Invalid API key status"),
];

const deleteApiKeyValidator = [...businessIdValidator, ...apiKeyIdValidator];

module.exports = {
  businessIdValidator,
  apiKeyIdValidator,
  createApiKeyValidator,
  getApiKeysValidator,
  getApiKeyValidator,
  updateApiKeyValidator,
  deleteApiKeyValidator,
};
