const { body } = require("express-validator");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("phone").optional({ values: "falsy" }).trim().isLength({ min: 7, max: 20 }).withMessage("Phone number is invalid"),

  body("password").notEmpty().withMessage("Password is required").isLength({ min: 8, max: 128 }).withMessage("Password must be between 8 and 128 characters"),
];

const verifyEmailValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("otp").trim().notEmpty().withMessage("OTP is required").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must contain only numbers"),
];

const resendOtpValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

const loginValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(), body("password").notEmpty().withMessage("Password is required")];

const updateMyProfileValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

  body("phone").optional({ values: "null" }).trim().isLength({ max: 30 }).withMessage("Phone cannot exceed 30 characters"),

  body("profileImage").optional({ values: "null" }).trim().isURL().withMessage("Profile image must be a valid URL"),

  body("profileImagePublicId").optional({ values: "null" }).trim().isLength({ max: 300 }).withMessage("Profile image public ID is invalid"),
];

module.exports = {
  registerValidator,
  verifyEmailValidator,
  resendOtpValidator,
  loginValidator,
  updateMyProfileValidator,
};
