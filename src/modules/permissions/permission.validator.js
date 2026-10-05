const { body, param, query } = require("express-validator");

const permissionIdValidator = [param("permissionId").trim().notEmpty().withMessage("Permission ID is required").isMongoId().withMessage("Invalid permission ID")];

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const slugValidator = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Permission slug is required")
    .isLength({ min: 2, max: 180 })
    .withMessage("Permission slug must be between 2 and 180 characters")
    .matches(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/)
    .withMessage("Invalid permission slug"),
];

const includeInactiveValidator = [query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean").toBoolean()];

const createPermissionValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Permission name is required").isLength({ min: 2, max: 150 }).withMessage("Permission name must be between 2 and 150 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Permission description cannot exceed 500 characters"),

  body("module")
    .trim()
    .notEmpty()
    .withMessage("Permission module is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Permission module must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Permission module can contain only letters, numbers, hyphens, and underscores"),

  body("action")
    .trim()
    .notEmpty()
    .withMessage("Permission action is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Permission action must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Permission action can contain only letters, numbers, hyphens, and underscores"),
];

const updatePermissionValidator = [
  ...permissionIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Permission name cannot be empty").isLength({ min: 2, max: 150 }).withMessage("Permission name must be between 2 and 150 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Permission description cannot exceed 500 characters"),

  body("module")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Permission module must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Permission module can contain only letters, numbers, hyphens, and underscores"),

  body("action")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Permission action must be between 2 and 100 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Permission action can contain only letters, numbers, hyphens, and underscores"),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean").toBoolean(),
];

const deletePermissionValidator = [...permissionIdValidator];

const getPermissionValidator = [...permissionIdValidator];

const getPermissionBySlugValidator = [...slugValidator];

const getBusinessPermissionsValidator = [...businessIdValidator, ...includeInactiveValidator];

const getAvailablePermissionsValidator = [...businessIdValidator, ...includeInactiveValidator];

const getSystemPermissionsValidator = [...includeInactiveValidator];

const createSystemPermissionsValidator = [];

module.exports = {
  permissionIdValidator,
  businessIdValidator,
  slugValidator,
  includeInactiveValidator,
  createPermissionValidator,
  updatePermissionValidator,
  deletePermissionValidator,
  getPermissionValidator,
  getPermissionBySlugValidator,
  getBusinessPermissionsValidator,
  getAvailablePermissionsValidator,
  getSystemPermissionsValidator,
  createSystemPermissionsValidator,
};
