const { body, param, query } = require("express-validator");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "NOTE", "SMS", "WHATSAPP", "FOLLOW_UP", "OTHER"];

const ACTIVITY_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const ACTIVITY_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

/*
 * Business ID
 */
const businessIdValidator = [param("businessId").matches(objectIdRegex).withMessage("Invalid business ID.")];

/*
 * Activity ID
 */
const activityIdValidator = [param("activityId").matches(objectIdRegex).withMessage("Invalid activity ID.")];

/*
 * Common pagination/list validators
 */
const paginationValidators = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100."),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Search cannot exceed 100 characters."),

  query("status").optional().isIn(ACTIVITY_STATUSES).withMessage("Invalid activity status."),

  query("type").optional().isIn(ACTIVITY_TYPES).withMessage("Invalid activity type."),

  query("assignedTo").optional().matches(objectIdRegex).withMessage("Invalid assigned user ID."),

  query("contactId").optional().matches(objectIdRegex).withMessage("Invalid contact ID."),

  query("companyId").optional().matches(objectIdRegex).withMessage("Invalid company ID."),

  query("leadId").optional().matches(objectIdRegex).withMessage("Invalid lead ID."),

  query("dealId").optional().matches(objectIdRegex).withMessage("Invalid deal ID."),
];

/*
 * Create activity
 */
const createActivityValidator = [
  ...businessIdValidator,

  body("type").notEmpty().withMessage("Activity type is required.").isIn(ACTIVITY_TYPES).withMessage("Invalid activity type."),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Activity subject is required.")
    .isLength({
      max: 200,
    })
    .withMessage("Activity subject cannot exceed 200 characters."),

  body("description")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters."),

  body("status").optional().isIn(ACTIVITY_STATUSES).withMessage("Invalid activity status."),

  body("priority").optional().isIn(ACTIVITY_PRIORITIES).withMessage("Invalid priority."),

  body("dueAt")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage("Invalid due date."),

  body("assignedTo")
    .optional({
      nullable: true,
    })
    .matches(objectIdRegex)
    .withMessage("Invalid assigned user ID."),

  body("contactId")
    .optional({
      nullable: true,
    })
    .matches(objectIdRegex)
    .withMessage("Invalid contact ID."),

  body("companyId")
    .optional({
      nullable: true,
    })
    .matches(objectIdRegex)
    .withMessage("Invalid company ID."),

  body("leadId")
    .optional({
      nullable: true,
    })
    .matches(objectIdRegex)
    .withMessage("Invalid lead ID."),

  body("dealId")
    .optional({
      nullable: true,
    })
    .matches(objectIdRegex)
    .withMessage("Invalid deal ID."),

  body("location")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Location cannot exceed 500 characters."),

  body("reminderAt")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage("Invalid reminder date."),

  body("tags")
    .optional()
    .isArray({
      max: 50,
    })
    .withMessage("Tags must be an array with a maximum of 50 tags."),

  body("tags.*").optional().matches(objectIdRegex).withMessage("Invalid tag ID."),

  body("metadata")
    .optional({
      nullable: true,
    })
    .isObject()
    .withMessage("Metadata must be an object."),
];

/*
 * Update activity
 */
const updateActivityValidator = [
  ...businessIdValidator,
  ...activityIdValidator,

  body("type").optional().isIn(ACTIVITY_TYPES).withMessage("Invalid activity type."),

  body("subject")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Subject cannot be empty.")
    .isLength({
      max: 200,
    })
    .withMessage("Subject cannot exceed 200 characters."),

  body("description")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters."),

  body("status").optional().isIn(ACTIVITY_STATUSES).withMessage("Invalid activity status."),

  body("priority").optional().isIn(ACTIVITY_PRIORITIES).withMessage("Invalid priority."),

  body("dueAt")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage("Invalid due date."),

  /*
   * null is intentionally allowed here
   * so frontend can unassign a user.
   */
  body("assignedTo")
    .optional({
      nullable: true,
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (!objectIdRegex.test(String(value))) {
        throw new Error("Invalid assigned user ID.");
      }

      return true;
    }),

  /*
   * null is intentionally allowed so
   * related records can be unlinked.
   */
  body("contactId")
    .optional({
      nullable: true,
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (!objectIdRegex.test(String(value))) {
        throw new Error("Invalid contact ID.");
      }

      return true;
    }),

  body("companyId")
    .optional({
      nullable: true,
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (!objectIdRegex.test(String(value))) {
        throw new Error("Invalid company ID.");
      }

      return true;
    }),

  body("leadId")
    .optional({
      nullable: true,
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (!objectIdRegex.test(String(value))) {
        throw new Error("Invalid lead ID.");
      }

      return true;
    }),

  body("dealId")
    .optional({
      nullable: true,
    })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      if (!objectIdRegex.test(String(value))) {
        throw new Error("Invalid deal ID.");
      }

      return true;
    }),

  body("location")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Location cannot exceed 500 characters."),

  body("outcome")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage("Outcome cannot exceed 2000 characters."),

  body("reminderAt")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage("Invalid reminder date."),

  body("tags")
    .optional({
      nullable: true,
    })
    .isArray({
      max: 50,
    })
    .withMessage("Tags must be an array with a maximum of 50 tags."),

  body("tags.*").optional().matches(objectIdRegex).withMessage("Invalid tag ID."),

  body("metadata")
    .optional({
      nullable: true,
    })
    .isObject()
    .withMessage("Metadata must be an object."),
];

/*
 * Complete activity
 */
const completeActivityValidator = [
  ...businessIdValidator,
  ...activityIdValidator,

  body("outcome")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage("Outcome cannot exceed 2000 characters."),
];

module.exports = {
  businessIdValidator,
  activityIdValidator,
  paginationValidators,
  createActivityValidator,
  updateActivityValidator,
  completeActivityValidator,
};
