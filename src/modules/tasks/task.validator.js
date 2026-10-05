const { body, param, query } = require("express-validator");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const businessIdValidator = [param("businessId").matches(objectIdPattern).withMessage("Invalid business ID.")];

const taskIdValidator = [...businessIdValidator, param("taskId").matches(objectIdPattern).withMessage("Invalid task ID.")];

const relatedToValidators = [
  body("relatedTo").optional({ nullable: true }).isObject().withMessage("Related record must be an object."),

  body("relatedTo.type").optional({ nullable: true }).isIn(["LEAD", "CONTACT", "COMPANY", "DEAL"]).withMessage("Invalid related record type."),

  body("relatedTo.id").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid related record ID."),
];

const createTaskValidator = [
  ...businessIdValidator,

  body("title").trim().notEmpty().withMessage("Task title is required.").isLength({ max: 200 }).withMessage("Task title cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).isString().withMessage("Description must be a string.").isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters."),

  body("status").optional().isIn(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).withMessage("Invalid task status."),

  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]).withMessage("Invalid task priority."),

  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date."),

  body("assignedTo").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid assigned user ID."),

  ...relatedToValidators,

  body("tags").optional().isArray().withMessage("Tags must be an array."),

  body("tags.*").optional().matches(objectIdPattern).withMessage("Invalid tag ID."),
];

const updateTaskValidator = [
  ...taskIdValidator,

  body("title").optional().trim().notEmpty().withMessage("Task title cannot be empty.").isLength({ max: 200 }).withMessage("Task title cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).isString().withMessage("Description must be a string.").isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters."),

  body("status").optional().isIn(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).withMessage("Invalid task status."),

  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]).withMessage("Invalid task priority."),

  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date."),

  body("assignedTo").optional({ nullable: true }).matches(objectIdPattern).withMessage("Invalid assigned user ID."),

  ...relatedToValidators,

  body("tags").optional().isArray().withMessage("Tags must be an array."),

  body("tags.*").optional().matches(objectIdPattern).withMessage("Invalid tag ID."),
];

const assignTaskValidator = [...taskIdValidator, body("assignedTo").matches(objectIdPattern).withMessage("Valid assigned user ID is required.")];

const paginationValidators = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("status").optional().isIn(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).withMessage("Invalid task status."),

  query("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]).withMessage("Invalid task priority."),

  query("assignedTo").optional().matches(objectIdPattern).withMessage("Invalid assigned user ID."),

  query("search").optional().isString().withMessage("Search must be a string.").trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),

  query("sortBy").optional().isIn(["createdAt", "updatedAt", "dueDate", "priority", "status", "title"]).withMessage("Invalid sort field."),

  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc."),
];

module.exports = {
  businessIdValidator,
  taskIdValidator,
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  paginationValidators,
};
