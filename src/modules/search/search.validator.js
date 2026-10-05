const { param, query } = require("express-validator");

const searchValidator = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),
  query("q").trim().isLength({ min: 2, max: 100 }).withMessage("Search query must contain 2-100 characters."),
  query("type").optional().isIn(["leads", "contacts", "companies", "deals", "tasks", "activities", "notes", "files"]).withMessage("Invalid search type."),
  query("limit").optional().isInt({ min: 1, max: 25 }).withMessage("Limit must be between 1 and 25."),
];

module.exports = { searchValidator };
