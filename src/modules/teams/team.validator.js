const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const teamIdValidator = [param("teamId").trim().notEmpty().withMessage("Team ID is required").isMongoId().withMessage("Invalid team ID")];

const memberIdValidator = [param("userId").trim().notEmpty().withMessage("User ID is required").isMongoId().withMessage("Invalid user ID")];

const paginationValidators = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

  query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean").toBoolean(),
];

const createTeamValidator = [
  ...businessIdValidator,

  body("name").trim().notEmpty().withMessage("Team name is required").isLength({ min: 2, max: 100 }).withMessage("Team name must be between 2 and 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

  body("managerId").optional({ values: "null" }).isMongoId().withMessage("Invalid manager ID"),

  body("members").optional().isArray().withMessage("Members must be an array"),

  body("members.*").optional().isMongoId().withMessage("Invalid member user ID"),
];

const updateTeamValidator = [
  ...businessIdValidator,
  ...teamIdValidator,

  body("name").optional().trim().notEmpty().withMessage("Team name cannot be empty").isLength({ min: 2, max: 100 }).withMessage("Team name must be between 2 and 100 characters"),

  body("description").optional({ values: "null" }).trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

  body("managerId")
    .optional({ values: "null" })
    .custom((value) => value === null || value === "" || /^[0-9a-fA-F]{24}$/.test(value))
    .withMessage("Invalid manager ID"),

  body("members").optional().isArray().withMessage("Members must be an array"),

  body("members.*").optional().isMongoId().withMessage("Invalid member user ID"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid team status"),
];

const getTeamValidator = [...businessIdValidator, ...teamIdValidator];

const addTeamMemberValidator = [...businessIdValidator, ...teamIdValidator, ...memberIdValidator];

const removeTeamMemberValidator = [...businessIdValidator, ...teamIdValidator, ...memberIdValidator];

module.exports = {
  businessIdValidator,
  teamIdValidator,
  memberIdValidator,
  paginationValidators,
  createTeamValidator,
  updateTeamValidator,
  getTeamValidator,
  addTeamMemberValidator,
  removeTeamMemberValidator,
};
