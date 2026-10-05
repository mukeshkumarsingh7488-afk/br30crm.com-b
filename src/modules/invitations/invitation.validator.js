const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const invitationIdValidator = [param("invitationId").trim().notEmpty().withMessage("Invitation ID is required").isMongoId().withMessage("Invalid invitation ID")];

const createInvitationValidator = [
  ...businessIdValidator,

  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),

  body("roleId").trim().notEmpty().withMessage("Role ID is required").isMongoId().withMessage("Invalid role ID"),
];

const getInvitationsValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("status").optional().isIn(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]).withMessage("Invalid invitation status"),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),
];

const getInvitationValidator = [...invitationIdValidator];

const acceptInvitationValidator = [body("token").trim().notEmpty().withMessage("Invitation token is required").isLength({ min: 64, max: 64 }).withMessage("Invalid invitation token")];

const resendInvitationValidator = [...businessIdValidator, ...invitationIdValidator];

const cancelInvitationValidator = [...businessIdValidator, ...invitationIdValidator];

module.exports = {
  businessIdValidator,
  invitationIdValidator,
  createInvitationValidator,
  getInvitationsValidator,
  getInvitationValidator,
  acceptInvitationValidator,
  resendInvitationValidator,
  cancelInvitationValidator,
};
