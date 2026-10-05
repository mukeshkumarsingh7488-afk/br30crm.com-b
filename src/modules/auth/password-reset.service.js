const ApiError = require("../../utils/ApiError");
const { generateOtp, hashOtp, getOtpExpiry, isOtpExpired } = require("../../utils/otp");
const { hashPassword } = require("../../utils/password");
const { findUserByEmail, updateUserById } = require("../users/user.service");
const { sendPasswordResetOtpEmail } = require("../../services/email.service");
const sessionService = require("../sessions/session.service");

const RESET_OTP_MAX_ATTEMPTS = 5;
const RESET_OTP_RESEND_COOLDOWN_SECONDS = 60;
const RESET_OTP_EXPIRY_MINUTES = 10;

const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail, true);

  // Do not reveal whether an email exists.
  if (!user) {
    return {
      passwordResetRequired: true,
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      passwordResetRequired: true,
    };
  }

  if (user.passwordResetLastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(user.passwordResetLastSentAt).getTime()) / 1000;

    if (elapsedSeconds < RESET_OTP_RESEND_COOLDOWN_SECONDS) {
      const remainingSeconds = Math.ceil(RESET_OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);

      throw new ApiError(429, `Please wait ${remainingSeconds} seconds before requesting another OTP.`);
    }
  }

  const otp = generateOtp();

  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = getOtpExpiry();
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = new Date();

  await user.save();

  try {
    await sendPasswordResetOtpEmail({
      email: user.email,
      name: user.name,
      otp,
      expiresInMinutes: RESET_OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetAttempts = 0;
    user.passwordResetLastSentAt = null;

    await user.save();

    throw new ApiError(500, "Password reset email could not be sent.");
  }

  return {
    passwordResetRequired: true,
  };
};

const verifyResetOtp = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail, true);

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  if (user.passwordResetAttempts >= RESET_OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect OTP attempts. Please request a new OTP.");
  }

  if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
    throw new ApiError(400, "OTP has expired. Please request a new OTP.");
  }

  if (!user.passwordResetOtpHash) {
    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  const submittedOtpHash = hashOtp(otp);

  if (submittedOtpHash !== user.passwordResetOtpHash) {
    user.passwordResetAttempts += 1;

    await user.save();

    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  return {
    email: user.email,
    otpVerified: true,
  };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail, true);

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  if (user.passwordResetAttempts >= RESET_OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect OTP attempts. Please request a new OTP.");
  }

  if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
    throw new ApiError(400, "OTP has expired. Please request a new OTP.");
  }

  if (!user.passwordResetOtpHash) {
    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  const submittedOtpHash = hashOtp(otp);

  if (submittedOtpHash !== user.passwordResetOtpHash) {
    user.passwordResetAttempts += 1;

    await user.save();

    throw new ApiError(400, "Invalid or expired password reset OTP.");
  }

  const passwordHash = await hashPassword(newPassword);

  user.password = passwordHash;

  // Consume the OTP immediately.
  user.passwordResetOtpHash = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = null;

  // Invalidate all existing refresh sessions.
  user.refreshTokenHash = null;
  await user.save();
  await sessionService.revokeAll(user._id);

  return {
    passwordReset: true,
  };
};

const resendResetOtp = async (email) => {
  return forgotPassword(email);
};

module.exports = {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
};
