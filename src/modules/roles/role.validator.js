const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const roleIdValidator = [param("roleId").trim().notEmpty().withMessage("Role ID is required").isMongoId().withMessage("Invalid role ID")];

const createRoleValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Role name is required").isLength({ min: 2, max: 100 }).withMessage("Role name must be between 2 and 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Role description cannot exceed 500 characters"),

  body("permissions").optional().isArray().withMessage("Permissions must be an array"),

  body("permissions.*").optional().isMongoId().withMessage("Each permission ID must be valid"),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean").toBoolean(),
];

const updateRoleValidator = [
  ...businessIdValidator,
  ...roleIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Role name cannot be empty").isLength({ min: 2, max: 100 }).withMessage("Role name must be between 2 and 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Role description cannot exceed 500 characters"),

  body("permissions").optional().isArray().withMessage("Permissions must be an array"),

  body("permissions.*").optional().isMongoId().withMessage("Each permission ID must be valid"),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean").toBoolean(),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean").toBoolean(),
];

const getRolesValidator = [...businessIdValidator, query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean").toBoolean()];

const getAvailableRolesValidator = [...businessIdValidator];

const getRoleValidator = [...roleIdValidator];

const deleteRoleValidator = [...businessIdValidator, ...roleIdValidator];

const createSystemRolesValidator = [];

module.exports = {
  businessIdValidator,
  roleIdValidator,
  createRoleValidator,
  updateRoleValidator,
  getRolesValidator,
  getAvailableRolesValidator,
  getRoleValidator,
  deleteRoleValidator,
  createSystemRolesValidator,
};
