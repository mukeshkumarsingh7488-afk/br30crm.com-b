const { body } = require("express-validator");

const forgotPasswordValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

const verifyResetOtpValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("otp").trim().notEmpty().withMessage("OTP is required").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must contain only numbers"),
];

const resendResetOtpValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

const resetPasswordValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("otp").trim().notEmpty().withMessage("OTP is required").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must contain only numbers"),

  body("newPassword").notEmpty().withMessage("New password is required").isLength({ min: 8, max: 128 }).withMessage("New password must be between 8 and 128 characters"),
];

module.exports = {
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resendResetOtpValidator,
  resetPasswordValidator,
};
