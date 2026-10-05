const { body, param, query } = require("express-validator");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const businessIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID.")];

const noteIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID."), param("noteId").matches(objectIdPattern).withMessage("Invalid note ID.")];

const createNoteValidator = [
  ...businessIdValidator,

  body("title").trim().notEmpty().withMessage("Note title is required.").isLength({ max: 200 }).withMessage("Note title cannot exceed 200 characters."),

  body("content").trim().notEmpty().withMessage("Note content is required.").isLength({ max: 10000 }).withMessage("Note content cannot exceed 10000 characters."),

  body("contactId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid contact ID."),

  body("companyId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid company ID."),

  body("leadId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid lead ID."),

  body("dealId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid deal ID."),

  body("tags").optional().isArray().withMessage("Tags must be an array."),

  body("tags.*").optional().matches(objectIdPattern).withMessage("Invalid tag ID."),

  body("isPinned").optional().isBoolean().withMessage("isPinned must be a boolean."),
];

const updateNoteValidator = [
  ...noteIdValidator,

  body("title").optional().trim().notEmpty().withMessage("Note title cannot be empty.").isLength({ max: 200 }).withMessage("Note title cannot exceed 200 characters."),

  body("content").optional().trim().notEmpty().withMessage("Note content cannot be empty.").isLength({ max: 10000 }).withMessage("Note content cannot exceed 10000 characters."),

  body("contactId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid contact ID."),

  body("companyId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid company ID."),

  body("leadId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid lead ID."),

  body("dealId").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid deal ID."),

  body("tags").optional().isArray().withMessage("Tags must be an array."),

  body("tags.*").optional().matches(objectIdPattern).withMessage("Invalid tag ID."),

  body("isPinned").optional().isBoolean().withMessage("isPinned must be a boolean."),

  body("isArchived").optional().isBoolean().withMessage("isArchived must be a boolean."),
];

const paginationValidators = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("search").optional().isString().withMessage("Search must be a string.").isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),

  query("contactId").optional().matches(objectIdPattern).withMessage("Invalid contact ID."),

  query("companyId").optional().matches(objectIdPattern).withMessage("Invalid company ID."),

  query("leadId").optional().matches(objectIdPattern).withMessage("Invalid lead ID."),

  query("dealId").optional().matches(objectIdPattern).withMessage("Invalid deal ID."),

  query("createdBy").optional().matches(objectIdPattern).withMessage("Invalid creator ID."),

  query("isPinned").optional().isBoolean().withMessage("isPinned must be a boolean."),

  query("isArchived").optional().isBoolean().withMessage("isArchived must be a boolean."),
];

module.exports = {
  businessIdValidator,
  noteIdValidator,
  createNoteValidator,
  updateNoteValidator,
  paginationValidators,
};
