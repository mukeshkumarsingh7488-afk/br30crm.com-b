const { body, param } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const createBusinessValidator = [
  body("name").trim().notEmpty().withMessage("Business name is required").isLength({ min: 2, max: 150 }).withMessage("Business name must be between 2 and 150 characters"),

  body("legalName").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Legal name cannot exceed 200 characters"),

  body("businessType").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Business type cannot exceed 100 characters"),

  body("industry").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Industry cannot exceed 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  body("logo").optional({ values: "null" }).trim().isURL().withMessage("Logo must be a valid URL"),

  body("website").optional({ values: "null" }).trim().isURL().withMessage("Website must be a valid URL"),

  body("email").optional({ values: "null" }).trim().isEmail().withMessage("Business email is invalid").normalizeEmail(),

  body("phone").optional({ values: "null" }).trim().isLength({ min: 7, max: 30 }).withMessage("Business phone number is invalid"),

  body("address").optional({ values: "null" }).isObject().withMessage("Address must be an object"),

  body("address.line1").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Address line 1 cannot exceed 200 characters"),

  body("address.line2").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Address line 2 cannot exceed 200 characters"),

  body("address.city").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("City cannot exceed 100 characters"),

  body("address.state").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("State cannot exceed 100 characters"),

  body("address.postalCode").optional({ values: "null" }).trim().isLength({ max: 20 }).withMessage("Postal code cannot exceed 20 characters"),

  body("address.country").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Country cannot exceed 100 characters"),

  body("timezone").optional({ values: "null" }).trim().isLength({ min: 1, max: 100 }).withMessage("Timezone is invalid"),

  body("currency").optional({ values: "null" }).trim().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code").isAlpha().withMessage("Currency must contain only letters").toUpperCase(),

  body("dateFormat").optional({ values: "null" }).trim().isLength({ min: 1, max: 50 }).withMessage("Date format is invalid"),

  body("timeFormat").optional({ values: "null" }).trim().isIn(["12h", "24h"]).withMessage("Time format must be either 12h or 24h"),

  body("settings").optional({ values: "null" }).isObject().withMessage("Settings must be an object"),

  body("onboardingCompleted").optional().isBoolean().withMessage("onboardingCompleted must be a boolean").toBoolean(),
];

const updateBusinessValidator = [
  ...businessIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Business name cannot be empty").isLength({ min: 2, max: 150 }).withMessage("Business name must be between 2 and 150 characters"),

  body("legalName").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Legal name cannot exceed 200 characters"),

  body("businessType").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Business type cannot exceed 100 characters"),

  body("industry").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Industry cannot exceed 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  body("logo").optional({ values: "null" }).trim().isURL().withMessage("Logo must be a valid URL"),

  body("website").optional({ values: "null" }).trim().isURL().withMessage("Website must be a valid URL"),

  body("email").optional({ values: "null" }).trim().isEmail().withMessage("Business email is invalid").normalizeEmail(),

  body("phone").optional({ values: "null" }).trim().isLength({ min: 7, max: 30 }).withMessage("Business phone number is invalid"),

  body("address").optional({ values: "null" }).isObject().withMessage("Address must be an object"),

  body("address.line1").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Address line 1 cannot exceed 200 characters"),

  body("address.line2").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Address line 2 cannot exceed 200 characters"),

  body("address.city").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("City cannot exceed 100 characters"),

  body("address.state").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("State cannot exceed 100 characters"),

  body("address.postalCode").optional({ values: "null" }).trim().isLength({ max: 20 }).withMessage("Postal code cannot exceed 20 characters"),

  body("address.country").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Country cannot exceed 100 characters"),

  body("timezone").optional({ values: "null" }).trim().isLength({ min: 1, max: 100 }).withMessage("Timezone is invalid"),

  body("currency").optional({ values: "null" }).trim().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code").isAlpha().withMessage("Currency must contain only letters").toUpperCase(),

  body("dateFormat").optional({ values: "null" }).trim().isLength({ min: 1, max: 50 }).withMessage("Date format is invalid"),

  body("timeFormat").optional({ values: "null" }).trim().isIn(["12h", "24h"]).withMessage("Time format must be either 12h or 24h"),

  body("settings").optional({ values: "null" }).isObject().withMessage("Settings must be an object"),

  body("onboardingCompleted").optional().isBoolean().withMessage("onboardingCompleted must be a boolean").toBoolean(),
];

const updateBusinessStatusValidator = [...businessIdValidator, body("status").trim().notEmpty().withMessage("Business status is required").isIn(["ACTIVE", "INACTIVE", "SUSPENDED"]).withMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED")];

module.exports = {
  businessIdValidator,
  createBusinessValidator,
  updateBusinessValidator,
  updateBusinessStatusValidator,
};
