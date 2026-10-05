const mongoose = require("mongoose");

const User = require("../users/user.model");
const Business = require("../businesses/business.model");
const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const Announcement = require("../announcements/announcement.model");
const WhatsNew = require("../whats-new/whats-new.model");

const ApiError = require("../../utils/ApiError");

const getDashboardStats = async ({ page = 1, limit = 20 } = {}) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [totalUsers, activeUsers, totalBusinesses, totalLeads, totalContacts, totalCompanies, totalDeals, totalAnnouncements, totalWhatsNew, users] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      status: "ACTIVE",
    }),

    Business.countDocuments(),

    Lead.countDocuments(),

    Contact.countDocuments(),

    Company.countDocuments(),

    Deal.countDocuments(),

    Announcement.countDocuments(),

    WhatsNew.countDocuments(),

    User.find({})
      .select("_id name email phone profileImage profileImagePublicId status emailVerified lastLoginAt createdAt updatedAt")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,

      list: users,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNumber),
      },
    },

    businesses: totalBusinesses,
    leads: totalLeads,
    contacts: totalContacts,
    companies: totalCompanies,
    deals: totalDeals,
    announcements: totalAnnouncements,
    whatsNew: totalWhatsNew,
  };
};

/*
 * ============================================================
 * GET SINGLE USER
 * ============================================================
 */

const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const user = await User.findById(userId).select("_id name email phone profileImage profileImagePublicId status emailVerified lastLoginAt createdAt updatedAt").lean();

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return user;
};

/*
 * ============================================================
 * UPDATE USER
 * ============================================================
 *
 * Admin can update:
 * - Name
 * - Email
 * - Phone
 *
 * Password is intentionally NOT editable from this endpoint.
 */

const updateUser = async (userId, { name, email, phone }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const user = await User.findById(userId).select("+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts +emailVerificationLastSentAt");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const updates = {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();

    if (normalizedName.length < 2) {
      throw new ApiError(400, "Name must contain at least 2 characters.");
    }

    if (normalizedName.length > 100) {
      throw new ApiError(400, "Name cannot exceed 100 characters.");
    }

    updates.name = normalizedName;
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      throw new ApiError(400, "Please provide a valid email address.");
    }

    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      }).select("_id");

      if (existingUser) {
        throw new ApiError(409, "This email address is already in use.");
      }

      updates.email = normalizedEmail;

      // Admin-edited email is considered verified.
      updates.emailVerified = true;
      updates.emailVerificationOtpHash = null;
      updates.emailVerificationOtpExpiresAt = null;
      updates.emailVerificationAttempts = 0;
      updates.emailVerificationLastSentAt = null;
    }
  }

  if (phone !== undefined) {
    const normalizedPhone = phone === null || String(phone).trim() === "" ? null : String(phone).trim();

    updates.phone = normalizedPhone;
  }
  updates.emailVerified = true;
  if (!Object.keys(updates).length) {
    throw new ApiError(400, "No changes were provided.");
  }

  Object.assign(user, updates);

  await user.save();

  return User.findById(user._id).select("_id name email phone profileImage profileImagePublicId status emailVerified lastLoginAt createdAt updatedAt").lean();
};

/*
 * ============================================================
 * BLOCK / UNBLOCK USER
 * ============================================================
 */

const updateUserStatus = async (userId, status) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid user status.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.status = status;

  await user.save();

  return User.findById(user._id).select("_id name email phone profileImage profileImagePublicId status emailVerified lastLoginAt createdAt updatedAt").lean();
};

/*
 * ============================================================
 * DELETE USER
 * ============================================================
 */

const deleteUser = async (userId, adminUserId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  if (String(userId) === String(adminUserId)) {
    throw new ApiError(400, "You cannot delete your own master admin account.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await User.deleteOne({
    _id: userId,
  });

  return {
    userId,
    deleted: true,
  };
};

module.exports = {
  getDashboardStats,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
};
