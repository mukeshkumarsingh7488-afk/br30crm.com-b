const { body, param, query } = require("express-validator");

const validateObjectId = (field) => param(field).isMongoId().withMessage(`${field} must be a valid ID`);

const dateQueryValidators = [query("startDate").notEmpty().withMessage("startDate is required").isISO8601().withMessage("startDate must be a valid date"), query("endDate").notEmpty().withMessage("endDate is required").isISO8601().withMessage("endDate must be a valid date")];

const businessIdValidator = [validateObjectId("businessId")];

const metricValidator = [
  validateObjectId("businessId"),
  param("metric").isIn(["leads", "contacts", "companies", "deals", "tasks", "activities"]).withMessage("Invalid analytics metric"),
  query("period").optional().isIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).withMessage("Invalid analytics period"),
  ...dateQueryValidators,
];

const snapshotIdValidator = [validateObjectId("businessId"), validateObjectId("snapshotId")];

const listSnapshotValidator = [
  validateObjectId("businessId"),

  query("metric").optional().isIn(["leads", "contacts", "companies", "deals", "tasks", "activities"]).withMessage("Invalid analytics metric"),

  query("period").optional().isIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).withMessage("Invalid analytics period"),

  query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),

  query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const createSnapshotValidator = [
  validateObjectId("businessId"),

  body("metric").isIn(["leads", "contacts", "companies", "deals", "tasks", "activities"]).withMessage("Invalid analytics metric"),

  body("period").optional().isIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).withMessage("Invalid analytics period"),

  body("startDate").notEmpty().withMessage("startDate is required").isISO8601().withMessage("startDate must be a valid date"),

  body("endDate").notEmpty().withMessage("endDate is required").isISO8601().withMessage("endDate must be a valid date"),

  body("dimensions").optional().isObject().withMessage("dimensions must be an object"),

  body("breakdown").optional().isObject().withMessage("breakdown must be an object"),

  body("metadata").optional().isObject().withMessage("metadata must be an object"),
];

module.exports = {
  businessIdValidator,
  metricValidator,
  snapshotIdValidator,
  listSnapshotValidator,
  createSnapshotValidator,
};
