const express = require("express");

const authController = require("./auth.controller");

const { registerValidator, verifyEmailValidator, resendOtpValidator, loginValidator, updateMyProfileValidator } = require("./auth.validator");

const { forgotPasswordValidator, verifyResetOtpValidator, resendResetOtpValidator, resetPasswordValidator } = require("./password-reset.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { authRateLimit, passwordRateLimit } = require("../../middleware/rateLimit");

const router = express.Router();

router.post("/register", authRateLimit, registerValidator, validate, authController.register);

router.post("/verify-email", authRateLimit, verifyEmailValidator, validate, authController.verifyEmail);

router.post("/resend-otp", authRateLimit, resendOtpValidator, validate, authController.resendOtp);

router.post("/login", authRateLimit, loginValidator, validate, authController.login);

router.post("/forgot-password", passwordRateLimit, forgotPasswordValidator, validate, authController.forgotPassword);

router.post("/verify-reset-otp", passwordRateLimit, verifyResetOtpValidator, validate, authController.verifyResetOtp);

router.post("/resend-reset-otp", passwordRateLimit, resendResetOtpValidator, validate, authController.resendResetOtp);

router.post("/reset-password", passwordRateLimit, resetPasswordValidator, validate, authController.resetPassword);

router.post("/refresh", authController.refresh);

router.post("/logout", auth, authController.logout);

router.get("/me", auth, authController.me);

router.patch("/profile", auth, updateMyProfileValidator, validate, authController.updateProfile);

router.get("/profile/image-signature", auth, authController.getProfileImageSignature);

router.delete("/profile/image", auth, authController.removeProfileImage);

module.exports = router;
