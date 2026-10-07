const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");

const ApiError = require("../../utils/ApiError");

const { generateOtp, hashOtp, getOtpExpiry, isOtpExpired } = require("../../utils/otp");

const { hashPassword, comparePassword } = require("../../utils/password");

const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../utils/jwt");

const { createUser, findUserByEmail, findUserById, updateUserById } = require("../users/user.service");

const PendingRegistration = require("./pending-registration.model");

const { sendVerificationOtpEmail } = require("../../services/email.service");

const AUTH_CONSTANTS = require("./auth.constants");

const cloudinaryService = require("./cloudinary.service");

const sessionService = require("../sessions/session.service");

const businessService = require("../businesses/business.service");

const getMasterAdminUserId = () => {
  return env.masterAdminUserId;
};

const isMasterAdmin = (userId) => {
  const masterAdminUserId = getMasterAdminUserId();

  if (!masterAdminUserId || !userId) {
    return false;
  }

  return String(userId) === String(masterAdminUserId);
};

const sanitizeUser = (user) => {
  const userObject = user?.toObject ? user.toObject() : { ...user };

  delete userObject.password;

  delete userObject.emailVerificationOtpHash;
  delete userObject.emailVerificationOtpExpiresAt;
  delete userObject.emailVerificationAttempts;
  delete userObject.emailVerificationLastSentAt;

  delete userObject.passwordResetOtpHash;
  delete userObject.passwordResetOtpExpiresAt;
  delete userObject.passwordResetAttempts;
  delete userObject.passwordResetLastSentAt;

  delete userObject.refreshTokenHash;

  const userId = userObject._id?.toString();

  userObject.isMasterAdmin = isMasterAdmin(userId);

  userObject.accessLevel = userObject.isMasterAdmin ? "MASTER_ADMIN" : "USER";

  return userObject;
};

const createAuthTokens = async (user, sessionContext = {}) => {
  if (!user?._id) {
    throw new ApiError(500, "Unable to create authentication session.");
  }

  const userId = user._id.toString();

  const sessionId = crypto.randomUUID();

  const payload = {
    userId,
    sessionId,
  };

  const accessToken = generateAccessToken(payload);

  const refreshToken = generateRefreshToken(payload);

  const decodedRefresh = jwt.decode(refreshToken);

  const expiresAt = decodedRefresh?.exp ? new Date(decodedRefresh.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  await sessionService.create({
    userId,
    sessionId,
    refreshToken,
    deviceName: sessionContext.deviceName || "Unknown device",
    userAgent: sessionContext.userAgent || "",
    ipAddress: sessionContext.ipAddress || "",
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    sessionId,
  };
};

const register = async ({ name, email, phone, password, businessName, legalConsent }) => {
  const normalizedName = String(name || "").trim();

  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  const normalizedPhone = phone ? String(phone).trim() : null;

  if (!normalizedName) {
    throw new ApiError(400, "Name is required.");
  }

  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw new ApiError(400, "Name must be between 2 and 100 characters.");
  }

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH || password.length > AUTH_CONSTANTS.PASSWORD_MAX_LENGTH) {
    throw new ApiError(400, `Password must be between ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} and ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.`);
  }

  const existingUser = await findUserByEmail(normalizedEmail, true);

  if (existingUser) {
    if (!existingUser.emailVerified) {
      throw new ApiError(409, "An account with this email already exists but is not verified. Please complete email verification.");
    }

    throw new ApiError(409, "An account with this email already exists.");
  }

  const existingPending = await PendingRegistration.findOne({
    email: normalizedEmail,
  });

  if (existingPending) {
    await PendingRegistration.deleteOne({
      _id: existingPending._id,
    });
  }

  const passwordHash = await hashPassword(password);

  const otp = generateOtp();

  const otpHash = hashOtp(otp);

  const otpExpiresAt = getOtpExpiry();

  const pendingExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const finalBusinessName = String(businessName || "").trim() || `${normalizedName}'s Business`;

  const pendingRegistration = await PendingRegistration.create({
    name: normalizedName,

    email: normalizedEmail,

    phone: normalizedPhone,

    passwordHash,

    emailVerificationOtpHash: otpHash,

    emailVerificationOtpExpiresAt: otpExpiresAt,

    emailVerificationAttempts: 0,

    emailVerificationLastSentAt: new Date(),

    legalConsent: {
      accepted: Boolean(legalConsent?.accepted),
      acceptedAt: legalConsent?.acceptedAt ? new Date(legalConsent.acceptedAt) : null,
      pages: Array.isArray(legalConsent?.pages) ? legalConsent.pages : [],
    },

    registrationData: {
      businessName: finalBusinessName,
    },

    expiresAt: pendingExpiresAt,
  });

  try {
    await sendVerificationOtpEmail({
      email: pendingRegistration.email,

      name: pendingRegistration.name,

      otp,

      expiresInMinutes: AUTH_CONSTANTS.OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    throw new ApiError(500, "Registration could not be completed because the verification email could not be sent.");
  }

  return {
    email: normalizedEmail,

    emailVerificationRequired: true,

    pendingRegistrationId: pendingRegistration._id,
  };
};

const verifyEmail = async ({ email, otp, deviceName = "Unknown device", userAgent = "", ipAddress = "" }) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  const normalizedOtp = String(otp || "").trim();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required.");
  }

  if (!normalizedOtp) {
    throw new ApiError(400, "OTP is required.");
  }

  const pending = await PendingRegistration.findOne({
    email: normalizedEmail,
  }).select("+passwordHash " + "+emailVerificationOtpHash " + "+emailVerificationOtpExpiresAt " + "+emailVerificationAttempts " + "+emailVerificationLastSentAt");

  if (!pending) {
    const existingUser = await findUserByEmail(normalizedEmail, false);

    if (existingUser?.emailVerified) {
      throw new ApiError(400, "Email is already verified. Please login.");
    }

    throw new ApiError(404, "Registration request not found or has expired. Please register again.");
  }

  if (pending.expiresAt && new Date(pending.expiresAt).getTime() <= Date.now()) {
    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    throw new ApiError(400, "Registration has expired. Please register again.");
  }

  if (pending.emailVerificationAttempts >= AUTH_CONSTANTS.OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect OTP attempts. Please request a new OTP.");
  }

  if (isOtpExpired(pending.emailVerificationOtpExpiresAt)) {
    throw new ApiError(400, "OTP has expired. Please request a new OTP.");
  }

  const submittedOtpHash = hashOtp(normalizedOtp);

  if (submittedOtpHash !== pending.emailVerificationOtpHash) {
    pending.emailVerificationAttempts += 1;

    await pending.save();

    throw new ApiError(400, "Invalid OTP.");
  }

  const existingUser = await findUserByEmail(normalizedEmail, true);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const registrationData = pending.registrationData && typeof pending.registrationData === "object" ? pending.registrationData : {};

  const finalBusinessName = String(registrationData.businessName || "").trim() || `${pending.name}'s Business`;

  let user = null;

  let business = null;

  try {
    user = await createUser({
      name: pending.name,

      email: pending.email,

      phone: pending.phone || null,

      password: pending.passwordHash,

      emailVerified: true,

      emailVerificationOtpHash: null,

      emailVerificationOtpExpiresAt: null,

      emailVerificationAttempts: 0,

      emailVerificationLastSentAt: null,

      legalConsent: pending.legalConsent
        ? {
            accepted: Boolean(pending.legalConsent.accepted),
            acceptedAt: pending.legalConsent.acceptedAt || null,
            pages: Array.isArray(pending.legalConsent.pages) ? pending.legalConsent.pages : [],
          }
        : {
            accepted: false,
            acceptedAt: null,
            pages: [],
          },

      status: "ACTIVE",
    });

    business = await businessService.createBusiness({
      name: finalBusinessName,

      ownerId: user._id,

      createdBy: user._id,

      legalName: null,

      businessType: null,

      industry: null,

      description: null,

      logo: null,

      website: null,

      email: user.email,

      phone: user.phone || null,

      address: {},

      timezone: "Asia/Kolkata",

      currency: "INR",

      dateFormat: "DD/MM/YYYY",

      timeFormat: "12h",

      settings: {},
    });

    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    const tokens = await createAuthTokens(user, {
      deviceName: deviceName || "Unknown device",

      userAgent: userAgent || "",

      ipAddress: ipAddress || "",
    });

    const updatedUser = await updateUserById(user._id, {
      lastLoginAt: new Date(),
    });

    const finalUser = updatedUser || user;

    const userIsMasterAdmin = isMasterAdmin(finalUser._id);

    return {
      user: sanitizeUser(finalUser),

      business: {
        _id: business._id,

        name: business.name,

        slug: business.slug,

        status: business.status,
      },

      emailVerified: true,

      registrationCompleted: true,

      isMasterAdmin: userIsMasterAdmin,

      accessLevel: userIsMasterAdmin ? "MASTER_ADMIN" : "USER",

      ...tokens,
    };
  } catch (error) {
    if (user?._id) {
      try {
        await user.deleteOne();
      } catch (cleanupError) {}
    }

    throw error;
  }
};

const resendOtp = async ({ email }) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required.");
  }

  const pending = await PendingRegistration.findOne({
    email: normalizedEmail,
  }).select("+emailVerificationOtpHash " + "+emailVerificationOtpExpiresAt " + "+emailVerificationAttempts " + "+emailVerificationLastSentAt");

  if (!pending) {
    throw new ApiError(404, "Registration request not found. Please register again.");
  }

  if (pending.expiresAt && new Date(pending.expiresAt).getTime() <= Date.now()) {
    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    throw new ApiError(400, "Registration has expired. Please register again.");
  }

  if (pending.emailVerificationLastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(pending.emailVerificationLastSentAt).getTime()) / 1000;

    if (elapsedSeconds < AUTH_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS) {
      const remainingSeconds = Math.ceil(AUTH_CONSTANTS.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);

      throw new ApiError(429, `Please wait ${remainingSeconds} seconds before requesting another OTP.`);
    }
  }

  const otp = generateOtp();

  pending.emailVerificationOtpHash = hashOtp(otp);

  pending.emailVerificationOtpExpiresAt = getOtpExpiry();

  pending.emailVerificationAttempts = 0;

  pending.emailVerificationLastSentAt = new Date();

  pending.expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await pending.save();

  try {
    await sendVerificationOtpEmail({
      email: pending.email,

      name: pending.name,

      otp,

      expiresInMinutes: AUTH_CONSTANTS.OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    throw new ApiError(500, "Verification email could not be sent.");
  }

  return {
    email: pending.email,

    emailVerificationRequired: true,
  };
};

const login = async ({ email, password }, sessionContext = {}) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  const user = await findUserByEmail(normalizedEmail, true);

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordValid = await comparePassword(password, user.password);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.emailVerified) {
    throw new ApiError(403, "Please verify your email before logging in.", {
      emailVerificationRequired: true,
    });
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, `Your account is ${user.status.toLowerCase()}.`);
  }

  const userIsMasterAdmin = isMasterAdmin(user._id);

  const tokens = await createAuthTokens(user, sessionContext);

  const updatedUser = await updateUserById(user._id, {
    lastLoginAt: new Date(),
  });

  const finalUser = updatedUser || user;

  return {
    user: sanitizeUser(finalUser),

    isMasterAdmin: userIsMasterAdmin,

    accessLevel: userIsMasterAdmin ? "MASTER_ADMIN" : "USER",

    ...tokens,
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  if (!decoded?.userId || !decoded?.sessionId) {
    throw new ApiError(401, "Invalid refresh session.");
  }

  const session = await sessionService.findByToken(refreshToken);

  if (!session || String(session.userId) !== String(decoded.userId) || String(session.sessionId) !== String(decoded.sessionId)) {
    throw new ApiError(401, "Invalid refresh session.");
  }

  const user = await findUserById(decoded.userId, true);

  if (!user || user.status !== "ACTIVE" || !user.emailVerified) {
    throw new ApiError(401, "Your account is not available for this session.");
  }

  await sessionService.revoke({
    userId: decoded.userId,

    sessionId: decoded.sessionId,
  });

  const tokens = await createAuthTokens(user, {
    deviceName: session.deviceName || "Unknown device",

    userAgent: session.userAgent || "",

    ipAddress: session.ipAddress || "",
  });

  const userIsMasterAdmin = isMasterAdmin(user._id);

  return {
    ...tokens,

    isMasterAdmin: userIsMasterAdmin,

    accessLevel: userIsMasterAdmin ? "MASTER_ADMIN" : "USER",
  };
};

const logout = async (userId, sessionId = null) => {
  if (!userId) {
    throw new ApiError(401, "Authentication required.");
  }

  if (sessionId) {
    try {
      await sessionService.revoke({
        userId,

        sessionId,
      });
    } catch (_error) {}
  } else {
    await sessionService.revokeAll(userId);
  }

  await updateUserById(userId, {
    refreshTokenHash: null,
  });
};

const getCurrentUser = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Authentication required.");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const userIsMasterAdmin = isMasterAdmin(user._id);

  return {
    user: sanitizeUser(user),

    isMasterAdmin: userIsMasterAdmin,

    accessLevel: userIsMasterAdmin ? "MASTER_ADMIN" : "USER",
  };
};

const updateProfile = async (userId, { name, phone, profileImage, profileImagePublicId }) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const updates = {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();

    if (normalizedName.length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters long.");
    }

    if (normalizedName.length > 100) {
      throw new ApiError(400, "Name cannot exceed 100 characters.");
    }

    updates.name = normalizedName;
  }

  if (phone !== undefined) {
    const normalizedPhone = phone === null ? null : String(phone).trim();

    if (normalizedPhone && normalizedPhone.length > 30) {
      throw new ApiError(400, "Phone cannot exceed 30 characters.");
    }

    updates.phone = normalizedPhone || null;
  }

  const imageWasProvided = profileImage !== undefined || profileImagePublicId !== undefined;

  let oldProfileImagePublicId = null;

  if (imageWasProvided) {
    oldProfileImagePublicId = user.profileImagePublicId || null;

    const normalizedProfileImage = profileImage === null ? null : String(profileImage).trim();

    const normalizedProfileImagePublicId = profileImagePublicId === null ? null : String(profileImagePublicId).trim();

    if (!normalizedProfileImage || !normalizedProfileImagePublicId) {
      updates.profileImage = null;

      updates.profileImagePublicId = null;
    } else {
      updates.profileImage = normalizedProfileImage;

      updates.profileImagePublicId = normalizedProfileImagePublicId;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No profile changes were provided.");
  }

  const updatedUser = await updateUserById(userId, updates);

  if (!updatedUser) {
    throw new ApiError(404, "User account not found.");
  }

  if (imageWasProvided && oldProfileImagePublicId && oldProfileImagePublicId !== updatedUser.profileImagePublicId) {
    try {
      await cloudinaryService.deleteProfileImage(oldProfileImagePublicId);
    } catch (error) {}
  }

  return sanitizeUser(updatedUser);
};

const removeProfileImage = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const publicId = user.profileImagePublicId || null;

  const updatedUser = await updateUserById(userId, {
    profileImage: null,

    profileImagePublicId: null,
  });

  if (!updatedUser) {
    throw new ApiError(404, "User account not found.");
  }

  if (publicId) {
    try {
      await cloudinaryService.deleteProfileImage(publicId);
    } catch (error) {}
  }

  return sanitizeUser(updatedUser);
};

module.exports = {
  register,
  verifyEmail,
  resendOtp,

  login,
  refresh,
  logout,

  getCurrentUser,

  updateProfile,
  removeProfileImage,

  isMasterAdmin,
};
