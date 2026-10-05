const { body, param, query } = require("express-validator");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const entityValues = ["LEAD", "CONTACT", "COMPANY", "DEAL", "ACTIVITY", "TASK", "NOTE"];

const fieldTypeValues = ["TEXT", "TEXTAREA", "NUMBER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME", "EMAIL", "PHONE", "URL", "SELECT", "MULTI_SELECT"];

const businessIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID.")];

const customFieldIdValidator = [...businessIdValidator, param("customFieldId").matches(objectIdPattern).withMessage("Invalid custom field ID.")];

const createCustomFieldValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Custom field name is required.").isLength({ min: 1, max: 100 }).withMessage("Custom field name must be between 1 and 100 characters."),

  body("label").optional().trim().isLength({ min: 1, max: 150 }).withMessage("Label must be between 1 and 150 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),

  body("entity").isIn(entityValues).withMessage("Invalid custom field entity."),

  body("fieldType").isIn(fieldTypeValues).withMessage("Invalid custom field type."),

  body("options").optional().isArray().withMessage("Options must be an array."),

  body("options.*.label").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Option label must be between 1 and 100 characters."),

  body("options.*.value").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Option value must be between 1 and 100 characters."),

  body("isRequired").optional().isBoolean().withMessage("isRequired must be a boolean."),

  body("sortOrder").optional().isInt().withMessage("sortOrder must be an integer."),

  body("placeholder").optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage("Placeholder cannot exceed 200 characters."),

  body("validation").optional().isObject().withMessage("Validation must be an object."),
];

const updateCustomFieldValidator = [
  ...customFieldIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Custom field name cannot be empty.").isLength({ min: 1, max: 100 }).withMessage("Custom field name must be between 1 and 100 characters."),

  body("label").optional().trim().isLength({ min: 1, max: 150 }).withMessage("Label must be between 1 and 150 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),

  body("options").optional().isArray().withMessage("Options must be an array."),

  body("options.*.label").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Option label must be between 1 and 100 characters."),

  body("options.*.value").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Option value must be between 1 and 100 characters."),

  body("isRequired").optional().isBoolean().withMessage("isRequired must be a boolean."),

  body("sortOrder").optional().isInt().withMessage("sortOrder must be an integer."),

  body("placeholder").optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage("Placeholder cannot exceed 200 characters."),

  body("defaultValue").optional({ nullable: true }),

  body("validation").optional().isObject().withMessage("Validation must be an object."),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean."),
];

const paginationValidators = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("search").optional().isString().withMessage("Search must be a string.").isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),

  query("entity").optional().isIn(entityValues).withMessage("Invalid custom field entity."),

  query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean."),
];

const entityFieldsValidator = [...businessIdValidator, param("entity").isIn(entityValues).withMessage("Invalid custom field entity."), query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean.")];

module.exports = {
  businessIdValidator,
  customFieldIdValidator,
  createCustomFieldValidator,
  updateCustomFieldValidator,
  paginationValidators,
  entityFieldsValidator,
};
