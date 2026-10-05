const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").isMongoId().withMessage("Invalid business ID.")];

const dealIdValidator = [param("dealId").isMongoId().withMessage("Invalid deal ID.")];

const createDealValidator = [
  ...businessIdValidator,

  body("pipelineId").isMongoId().withMessage("Valid pipeline ID is required."),

  body("stageId").isMongoId().withMessage("Valid stage ID is required."),

  body("contactId").optional({ nullable: true }).isMongoId().withMessage("Invalid contact ID."),

  body("companyId").optional({ nullable: true }).isMongoId().withMessage("Invalid company ID."),

  body("name").trim().notEmpty().withMessage("Deal name is required.").isLength({ max: 200 }).withMessage("Deal name cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),

  body("value").optional().isFloat({ min: 0 }).withMessage("Deal value must be a positive number."),

  body("currency").optional().trim().isLength({ min: 3, max: 10 }).withMessage("Currency must be between 3 and 10 characters."),

  body("expectedCloseDate").optional({ nullable: true }).isISO8601().withMessage("Invalid expected close date."),

  body("status").optional().isIn(["OPEN", "WON", "LOST"]).withMessage("Invalid deal status."),

  body("probability").optional().isFloat({ min: 0, max: 100 }).withMessage("Probability must be between 0 and 100."),

  body("source").optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage("Source cannot exceed 100 characters."),

  body("assignedTo").optional({ nullable: true }).isMongoId().withMessage("Invalid assigned user ID."),

  body("lostReason").optional({ nullable: true }).isLength({ max: 1000 }).withMessage("Lost reason cannot exceed 1000 characters."),
];

const listDealsValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("status").optional().isIn(["OPEN", "WON", "LOST"]).withMessage("Invalid deal status."),

  query("pipelineId").optional().isMongoId().withMessage("Invalid pipeline ID."),

  query("stageId").optional().isMongoId().withMessage("Invalid stage ID."),

  query("assignedTo").optional().isMongoId().withMessage("Invalid assigned user ID."),

  query("contactId").optional().isMongoId().withMessage("Invalid contact ID."),

  query("companyId").optional().isMongoId().withMessage("Invalid company ID."),

  query("includeInactive").optional().isBoolean().withMessage("includeInactive must be true or false."),
];

const getDealValidator = [...businessIdValidator, ...dealIdValidator];

const updateDealValidator = [
  ...businessIdValidator,
  ...dealIdValidator,

  body("pipelineId").optional().isMongoId().withMessage("Invalid pipeline ID."),

  body("stageId").optional().isMongoId().withMessage("Invalid stage ID."),

  body("contactId").optional({ nullable: true }).isMongoId().withMessage("Invalid contact ID."),

  body("companyId").optional({ nullable: true }).isMongoId().withMessage("Invalid company ID."),

  body("name").optional().trim().notEmpty().withMessage("Deal name cannot be empty.").isLength({ max: 200 }).withMessage("Deal name cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),

  body("value").optional().isFloat({ min: 0 }).withMessage("Deal value must be a positive number."),

  body("currency").optional().trim().isLength({ min: 3, max: 10 }).withMessage("Currency must be between 3 and 10 characters."),

  body("expectedCloseDate").optional({ nullable: true }).isISO8601().withMessage("Invalid expected close date."),

  body("status").optional().isIn(["OPEN", "WON", "LOST"]).withMessage("Invalid deal status."),

  body("probability").optional().isFloat({ min: 0, max: 100 }).withMessage("Probability must be between 0 and 100."),

  body("source").optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage("Source cannot exceed 100 characters."),

  body("assignedTo").optional({ nullable: true }).isMongoId().withMessage("Invalid assigned user ID."),

  body("lostReason").optional({ nullable: true }).isLength({ max: 1000 }).withMessage("Lost reason cannot exceed 1000 characters."),
];

const assignDealValidator = [...businessIdValidator, ...dealIdValidator, body("userId").isMongoId().withMessage("Valid user ID is required.")];

const moveDealValidator = [...businessIdValidator, ...dealIdValidator, body("stageId").isMongoId().withMessage("Valid stage ID is required.")];

module.exports = {
  businessIdValidator,
  dealIdValidator,
  createDealValidator,
  listDealsValidator,
  getDealValidator,
  updateDealValidator,
  assignDealValidator,
  moveDealValidator,
};
