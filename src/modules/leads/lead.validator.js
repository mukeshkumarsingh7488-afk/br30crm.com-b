const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const leadIdValidator = [param("leadId").trim().notEmpty().withMessage("Lead ID is required").isMongoId().withMessage("Invalid lead ID")];

const createLeadValidator = [
  ...businessIdValidator,

  body("firstName").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("First name cannot exceed 100 characters"),

  body("lastName").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Last name cannot exceed 100 characters"),

  body("name").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Name cannot exceed 200 characters"),

  body("email").optional({ values: "null" }).trim().isEmail().withMessage("Invalid email address").normalizeEmail(),

  body("phone").optional({ values: "null" }).trim().isLength({ max: 50 }).withMessage("Phone cannot exceed 50 characters"),

  body("companyName").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Company name cannot exceed 200 characters"),

  body("jobTitle").optional({ values: "null" }).trim().isLength({ max: 150 }).withMessage("Job title cannot exceed 150 characters"),

  body("source").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).withMessage("Invalid lead status"),

  body("rating").optional().isIn(["HOT", "WARM", "COLD"]).withMessage("Invalid lead rating"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters"),

  body("assignedTo").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned user ID"),

  body("assignedTeamId").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned team ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*").optional().isMongoId().withMessage("Invalid tag ID"),

  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),
];

const updateLeadValidator = [
  ...businessIdValidator,
  ...leadIdValidator,

  body("firstName").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("First name cannot exceed 100 characters"),

  body("lastName").optional({ values: "null" }).trim().isLength({ max: 100 }).withMessage("Last name cannot exceed 100 characters"),

  body("name").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Name cannot exceed 200 characters"),

  body("email").optional({ values: "null" }).trim().isEmail().withMessage("Invalid email address").normalizeEmail(),

  body("phone").optional({ values: "null" }).trim().isLength({ max: 50 }).withMessage("Phone cannot exceed 50 characters"),

  body("companyName").optional({ values: "null" }).trim().isLength({ max: 200 }).withMessage("Company name cannot exceed 200 characters"),

  body("jobTitle").optional({ values: "null" }).trim().isLength({ max: 150 }).withMessage("Job title cannot exceed 150 characters"),

  body("source").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).withMessage("Invalid lead status"),

  body("rating").optional().isIn(["HOT", "WARM", "COLD"]).withMessage("Invalid lead rating"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters"),

  body("assignedTo").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned user ID"),

  body("assignedTeamId").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned team ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*").optional().isMongoId().withMessage("Invalid tag ID"),

  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),
];

const getLeadsValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

  query("status").optional().isIn(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).withMessage("Invalid lead status"),

  query("rating").optional().isIn(["HOT", "WARM", "COLD"]).withMessage("Invalid lead rating"),

  query("source").optional().trim().isLength({ max: 100 }).withMessage("Source cannot exceed 100 characters"),

  query("assignedTo").optional().isMongoId().withMessage("Invalid assigned user ID"),

  query("assignedTeamId").optional().isMongoId().withMessage("Invalid assigned team ID"),
];

const getLeadValidator = [...businessIdValidator, ...leadIdValidator];

const assignLeadValidator = [...businessIdValidator, ...leadIdValidator, body("assignedTo").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned user ID"), body("assignedTeamId").optional({ values: "null" }).isMongoId().withMessage("Invalid assigned team ID")];

const convertLeadValidator = [...businessIdValidator, ...leadIdValidator, body("companyId").optional({ values: "null" }).isMongoId().withMessage("Invalid company ID")];

const deleteLeadValidator = [...businessIdValidator, ...leadIdValidator];

module.exports = {
  businessIdValidator,
  leadIdValidator,
  createLeadValidator,
  updateLeadValidator,
  getLeadsValidator,
  getLeadValidator,
  assignLeadValidator,
  convertLeadValidator,
  deleteLeadValidator,
};
