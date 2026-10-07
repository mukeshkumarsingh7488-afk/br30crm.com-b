const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const contactIdValidator = [param("contactId").trim().notEmpty().withMessage("Contact ID is required").isMongoId().withMessage("Invalid contact ID")];

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

const createContactValidator = [
  ...businessIdValidator,

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage("First name must be between 1 and 100 characters"),

  body("lastName")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Last name cannot exceed 100 characters"),

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

  body("jobTitle")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Job title cannot exceed 150 characters"),

  body("companyId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid company ID"),

  body("source")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid contact status"),

  body("lifecycleStage").optional().isIn(["CONTACT", "CUSTOMER", "REPEAT_CUSTOMER", "OTHER"]).withMessage("Invalid lifecycle stage"),

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

  body("sourceLeadId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid source lead ID"),

  ...addressValidator,
];

const updateContactValidator = [
  ...businessIdValidator,
  ...contactIdValidator,

  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage("First name must be between 1 and 100 characters"),

  body("lastName")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Last name cannot exceed 100 characters"),

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

  body("jobTitle")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Job title cannot exceed 150 characters"),

  body("companyId")
    .optional({
      values: "null",
    })
    .isMongoId()
    .withMessage("Invalid company ID"),

  body("source")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Source must be between 2 and 100 characters"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid contact status"),

  body("lifecycleStage").optional().isIn(["CONTACT", "CUSTOMER", "REPEAT_CUSTOMER", "OTHER"]).withMessage("Invalid lifecycle stage"),

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

const getContactsValidator = [
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

  query("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid contact status"),

  query("lifecycleStage").optional().isIn(["CONTACT", "CUSTOMER", "REPEAT_CUSTOMER", "OTHER"]).withMessage("Invalid lifecycle stage"),

  query("source")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Source cannot exceed 100 characters"),

  query("companyId").optional().isMongoId().withMessage("Invalid company ID"),

  query("assignedTo").optional().isMongoId().withMessage("Invalid assigned user ID"),

  query("assignedTeamId").optional().isMongoId().withMessage("Invalid assigned team ID"),
];

const getContactValidator = [...businessIdValidator, ...contactIdValidator];

const assignContactValidator = [
  ...businessIdValidator,
  ...contactIdValidator,

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

const deleteContactValidator = [...businessIdValidator, ...contactIdValidator];

module.exports = {
  businessIdValidator,
  contactIdValidator,
  createContactValidator,
  updateContactValidator,
  getContactsValidator,
  getContactValidator,
  assignContactValidator,
  deleteContactValidator,
};
