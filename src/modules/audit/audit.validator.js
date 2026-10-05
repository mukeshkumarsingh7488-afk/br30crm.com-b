const { param, query } = require("express-validator");
const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const businessIdValidator = [param("businessId").custom(isObjectId).withMessage("Invalid business ID")];

const auditIdValidator = [param("auditId").custom(isObjectId).withMessage("Invalid audit log ID")];

const entityAuditValidator = [
  param("businessId").custom(isObjectId).withMessage("Invalid business ID"),

  param("entityType").trim().notEmpty().withMessage("Entity type is required").isLength({ max: 100 }).withMessage("Entity type cannot exceed 100 characters"),

  param("entityId").custom(isObjectId).withMessage("Invalid entity ID"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const listAuditValidator = [
  param("businessId").custom(isObjectId).withMessage("Invalid business ID"),

  query("actorId").optional().custom(isObjectId).withMessage("Invalid actor ID"),

  query("action").optional().trim().isLength({ max: 100 }).withMessage("Action cannot exceed 100 characters"),

  query("module").optional().trim().isLength({ max: 100 }).withMessage("Module cannot exceed 100 characters"),

  query("entityType").optional().trim().isLength({ max: 100 }).withMessage("Entity type cannot exceed 100 characters"),

  query("entityId").optional().custom(isObjectId).withMessage("Invalid entity ID"),

  query("severity").optional().isIn(["INFO", "WARNING", "ERROR", "CRITICAL"]).withMessage("Invalid severity"),

  query("status").optional().isIn(["SUCCESS", "FAILED"]).withMessage("Invalid status"),

  query("startDate").optional().isISO8601().withMessage("Invalid start date"),

  query("endDate").optional().isISO8601().withMessage("Invalid end date"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  businessIdValidator,
  auditIdValidator,
  entityAuditValidator,
  listAuditValidator,
};
