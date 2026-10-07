const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const authService = require("./auth.service");
const passwordResetService = require("./password-reset.service");
const cloudinaryService = require("./cloudinary.service");

const { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } = require("../../utils/cookies");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return ApiResponse.created(res, result, "Registration successful. Please verify your email.");
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body, {
    deviceName: req.headers["x-device-name"] || req.headers["sec-ch-ua"] || "Unknown device",

    userAgent: req.get("user-agent") || "",

    ipAddress: req.ip || req.socket?.remoteAddress || "",
  });

  setRefreshTokenCookie(res, result.refreshToken);

  const { refreshToken, ...responseData } = result;

  return ApiResponse.success(res, responseData, "Email verified successfully. Your account has been created and you are now logged in.");
});

const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);

  return ApiResponse.success(res, result, "A new verification OTP has been sent.");
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, {
    deviceName: req.headers["x-device-name"] || req.headers["sec-ch-ua"] || "Unknown device",

    userAgent: req.get("user-agent") || "",

    ipAddress: req.ip || req.socket?.remoteAddress || "",
  });

  setRefreshTokenCookie(res, result.refreshToken);

  const { refreshToken, ...responseData } = result;

  return ApiResponse.success(res, responseData, "Login successful.");
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromCookie(req);

  const tokens = await authService.refresh(refreshToken);

  setRefreshTokenCookie(res, tokens.refreshToken);

  return ApiResponse.success(
    res,
    {
      accessToken: tokens.accessToken,

      isMasterAdmin: tokens.isMasterAdmin,

      accessLevel: tokens.accessLevel,
    },
    "Access token refreshed."
  );
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.userId, req.user.sessionId || null);

  clearRefreshTokenCookie(res);

  return ApiResponse.success(res, null, "Logout successful.");
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user.userId);

  return ApiResponse.success(res, result, "Current user fetched successfully.");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await passwordResetService.forgotPassword(req.body.email);

  return ApiResponse.success(res, result, "If an account exists with this email, a password reset OTP has been sent.");
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await passwordResetService.verifyResetOtp(req.body);

  return ApiResponse.success(res, result, "Password reset OTP verified successfully.");
});

const resendResetOtp = asyncHandler(async (req, res) => {
  const result = await passwordResetService.resendResetOtp(req.body.email);

  return ApiResponse.success(res, result, "If an account exists with this email, a new password reset OTP has been sent.");
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await passwordResetService.resetPassword(req.body);

  return ApiResponse.success(res, result, "Password reset successfully. Please login with your new password.");
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.userId, req.body);

  return ApiResponse.success(res, { user }, "Profile updated successfully.");
});

const getProfileImageSignature = asyncHandler(async (req, res) => {
  const result = cloudinaryService.generateProfileImageSignature(req.user.userId);

  return ApiResponse.success(res, result, "Profile image upload signature generated successfully.");
});

const removeProfileImage = asyncHandler(async (req, res) => {
  const user = await authService.removeProfileImage(req.user.userId);

  return ApiResponse.success(res, { user }, "Profile image removed successfully.");
});

module.exports = {
  register,
  verifyEmail,
  resendOtp,

  login,
  refresh,
  logout,
  me,

  updateProfile,
  getProfileImageSignature,
  removeProfileImage,

  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
};
