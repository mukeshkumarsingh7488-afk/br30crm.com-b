const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const companyIdValidator = [param("companyId").trim().notEmpty().withMessage("Company ID is required").isMongoId().withMessage("Invalid company ID")];

const addressValidator = [
  body("address").optional().isObject().withMessage("Address must be an object"),

  body("address.street")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage("Street cannot exceed 250 characters"),

  body("address.city")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("City cannot exceed 100 characters"),

  body("address.state")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("State cannot exceed 100 characters"),

  body("address.country")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Country cannot exceed 100 characters"),

  body("address.postalCode")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage("Postal code cannot exceed 30 characters"),
];

const createCompanyValidator = [
  ...businessIdValidator,

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({
      min: 2,
      max: 200,
    })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("legalName")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage("Legal name cannot exceed 250 characters"),

  body("email")
    .optional({
      values: "null",
    })
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Phone cannot exceed 50 characters"),

  body("alternatePhone")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Alternate phone cannot exceed 50 characters"),

  body("website")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 300,
    })
    .withMessage("Website cannot exceed 300 characters"),

  body("industry")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Industry cannot exceed 150 characters"),

  body("companySize").optional().isIn(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).withMessage("Invalid company size"),

  body("source")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid company status"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters"),

  body("assignedTo")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned user ID"),

  body("assignedTeamId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned team ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*").optional().isMongoId().withMessage("Invalid tag ID"),

  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),

  ...addressValidator,
];

const updateCompanyValidator = [
  ...businessIdValidator,
  ...companyIdValidator,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty")
    .isLength({
      min: 2,
      max: 200,
    })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("legalName")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage("Legal name cannot exceed 250 characters"),

  body("email")
    .optional({
      values: "null",
    })
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Phone cannot exceed 50 characters"),

  body("alternatePhone")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Alternate phone cannot exceed 50 characters"),

  body("website")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 300,
    })
    .withMessage("Website cannot exceed 300 characters"),

  body("industry")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Industry cannot exceed 150 characters"),

  body("companySize").optional().isIn(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).withMessage("Invalid company size"),

  body("source")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid company status"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters"),

  body("assignedTo")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned user ID"),

  body("assignedTeamId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned team ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*").optional().isMongoId().withMessage("Invalid tag ID"),

  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),

  ...addressValidator,
];

const getCompaniesValidator = [
  ...businessIdValidator,

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be at least 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Search cannot exceed 100 characters"),

  query("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid company status"),

  query("industry")
    .optional()
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Industry cannot exceed 150 characters"),

  query("companySize").optional().isIn(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).withMessage("Invalid company size"),

  query("source")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Source cannot exceed 100 characters"),

  query("assignedTo").optional().isMongoId().withMessage("Invalid assigned user ID"),

  query("assignedTeamId").optional().isMongoId().withMessage("Invalid assigned team ID"),
];

const getCompanyValidator = [...businessIdValidator, ...companyIdValidator];

const assignCompanyValidator = [
  ...businessIdValidator,
  ...companyIdValidator,

  body("assignedTo")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned user ID"),

  body("assignedTeamId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid assigned team ID"),
];

const getCompanyContactsValidator = [
  ...businessIdValidator,
  ...companyIdValidator,

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be at least 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Search cannot exceed 100 characters"),

  query("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid contact status"),
];

const deleteCompanyValidator = [...businessIdValidator, ...companyIdValidator];

module.exports = {
  businessIdValidator,
  companyIdValidator,
  createCompanyValidator,
  updateCompanyValidator,
  getCompaniesValidator,
  getCompanyValidator,
  assignCompanyValidator,
  getCompanyContactsValidator,
  deleteCompanyValidator,
};
