const { body, param, query } = require("express-validator");

const businessId = param("businessId").isMongoId().withMessage("businessId must be a valid ID");

const sourceId = param("sourceId").isMongoId().withMessage("sourceId must be a valid ID");

exports.list = [
  businessId,

  query("type").optional().isIn(["SOURCE", "CAMPAIGN"]).withMessage("type must be SOURCE or CAMPAIGN"),

  query("active").optional().isBoolean().withMessage("active must be a boolean"),

  query("search").optional().isString().trim().isLength({ max: 100 }).withMessage("search cannot exceed 100 characters"),
];

exports.create = [
  businessId,

  body("name").trim().notEmpty().withMessage("Source or campaign name is required").isLength({ max: 150 }).withMessage("Name cannot exceed 150 characters"),

  body("type").optional().isIn(["SOURCE", "CAMPAIGN"]).withMessage("type must be SOURCE or CAMPAIGN"),

  body("code").optional().isString().trim().isLength({ max: 120 }).withMessage("code cannot exceed 120 characters"),

  body("description").optional().isString().trim().isLength({ max: 500 }).withMessage("description cannot exceed 500 characters"),

  body("medium").optional().isString().trim().isLength({ max: 100 }).withMessage("medium cannot exceed 100 characters"),

  body("active").optional().isBoolean().withMessage("active must be a boolean"),

  body("metadata").optional().isObject().withMessage("metadata must be an object"),
];

exports.update = [
  businessId,
  sourceId,

  body("name").optional().trim().notEmpty().isLength({ max: 150 }).withMessage("name must be between 1 and 150 characters"),

  body("type").optional().isIn(["SOURCE", "CAMPAIGN"]).withMessage("type must be SOURCE or CAMPAIGN"),

  body("code").optional().isString().trim().isLength({ max: 120 }).withMessage("code cannot exceed 120 characters"),

  body("description").optional().isString().trim().isLength({ max: 500 }).withMessage("description cannot exceed 500 characters"),

  body("medium").optional().isString().trim().isLength({ max: 100 }).withMessage("medium cannot exceed 100 characters"),

  body("active").optional().isBoolean().withMessage("active must be a boolean"),

  body("metadata").optional().isObject().withMessage("metadata must be an object"),
];

exports.byId = [businessId, sourceId];

exports.link = [
  businessId,
  sourceId,

  query("formId").optional().isMongoId().withMessage("formId must be a valid ID"),

  query("formSlug").optional().isString().trim().isLength({ max: 180 }).withMessage("formSlug cannot exceed 180 characters"),

  query("baseUrl")
    .optional()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("baseUrl must be a valid HTTP/HTTPS URL"),
];
