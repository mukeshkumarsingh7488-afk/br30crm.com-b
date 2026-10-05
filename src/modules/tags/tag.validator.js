const { body, param, query } = require("express-validator");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const businessIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID.")];

const tagIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID."), param("tagId").matches(objectIdPattern).withMessage("Invalid tag ID.")];

const createTagValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Tag name is required.").isLength({ min: 1, max: 100 }).withMessage("Tag name must be between 1 and 100 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),

  body("color").optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage("Color cannot exceed 30 characters."),

  body("type").optional().isIn(["SYSTEM", "CUSTOM"]).withMessage("Invalid tag type."),
];

const updateTagValidator = [
  ...tagIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Tag name cannot be empty.").isLength({ min: 1, max: 100 }).withMessage("Tag name must be between 1 and 100 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),

  body("color").optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage("Color cannot exceed 30 characters."),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean."),
];

const paginationValidators = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("search").optional().isString().withMessage("Search must be a string.").isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),

  query("type").optional().isIn(["SYSTEM", "CUSTOM"]).withMessage("Invalid tag type."),

  query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean."),
];

module.exports = {
  businessIdValidator,
  tagIdValidator,
  createTagValidator,
  updateTagValidator,
  paginationValidators,
};
