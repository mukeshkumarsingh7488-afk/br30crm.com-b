const ApiError = require("../../utils/ApiError");
const Business = require("./business.model");
const BusinessMember = require("../business-members/business-member.model");
const businessMemberService = require("../business-members/business-member.service");
const roleService = require("../roles/role.service");
const settingService = require("../settings/setting.service");

/* ============================================================
 * NORMALIZE BUSINESS SLUG
 * ============================================================ */

const normalizeSlug = (value) => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

/* ============================================================
 * GENERATE UNIQUE BUSINESS SLUG
 * ============================================================ */

const generateUniqueSlug = async (name, excludeBusinessId = null) => {
  const baseSlug = normalizeSlug(name);

  if (!baseSlug) {
    throw new ApiError(400, "A valid business name is required.");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = {
      slug,
    };

    if (excludeBusinessId) {
      query._id = {
        $ne: excludeBusinessId,
      };
    }

    const existingBusiness = await Business.findOne(query).select("_id");

    if (!existingBusiness) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

/* ============================================================
 * CREATE BUSINESS
 *
 * Registration onboarding flow:
 *
 * Create User
 *      ↓
 * Create Business
 *      ↓
 * Create Owner Role
 *      ↓
 * Create BusinessMember
 *      ↓
 * Create Default Settings
 *
 * NOTE:
 * User + PendingRegistration handling is done by auth.service.
 * ============================================================ */

const createBusiness = async ({ name, legalName, businessType, industry, description, ownerId, logo, website, email, phone, address, timezone, currency, dateFormat, timeFormat, settings, createdBy }) => {
  if (!ownerId) {
    throw new ApiError(400, "Business owner is required.");
  }

  if (!createdBy) {
    throw new ApiError(400, "Business creator is required.");
  }

  const slug = await generateUniqueSlug(name);

  let business = null;

  try {
    /* ========================================================
     * STEP 1 — CREATE BUSINESS
     * ======================================================== */

    business = await Business.create({
      name,
      slug,
      legalName: legalName || null,
      businessType: businessType || null,
      industry: industry || null,
      description: description || null,

      ownerId,

      logo: logo || null,
      website: website || null,
      email: email || null,
      phone: phone || null,
      address: address || {},

      timezone: timezone || "Asia/Kolkata",
      currency: currency || "INR",
      dateFormat: dateFormat || "DD/MM/YYYY",

      /*
       * IMPORTANT:
       * Setting model accepts only:
       * "12h" or "24h"
       */
      timeFormat: timeFormat || "12h",

      settings: settings || {},

      createdBy,
    });

    /* ========================================================
     * STEP 2 — CREATE / GET OWNER ROLE
     * ======================================================== */

    const ownerRole = await roleService.getBusinessOwnerRole(createdBy);

    if (!ownerRole?._id) {
      throw new ApiError(500, "Business Owner role could not be created or found.");
    }

    /* ========================================================
     * STEP 3 — CREATE OWNER BUSINESS MEMBER
     * ======================================================== */

    await businessMemberService.addMember({
      businessId: business._id,
      userId: ownerId,
      roleId: ownerRole._id,
      status: "ACTIVE",
      invitedBy: null,
      createdBy,
    });

    /* ========================================================
     * STEP 4 — CREATE DEFAULT SETTINGS
     * ======================================================== */

    await settingService.createDefaultSettingsForBusiness({
      businessId: business._id,
      userId: createdBy,
      business,
    });

    /* ========================================================
     * STEP 5 — RETURN BUSINESS
     * ======================================================== */

    return business;
  } catch (error) {
    /*
     * ========================================================
     * ONBOARDING FAILURE CLEANUP
     *
     * If any step after Business creation fails,
     * remove everything created for this business.
     *
     * This prevents:
     * - Business without member
     * - Business without settings
     * - Half-created onboarding
     * ========================================================
     */

    if (business?._id) {
      try {
        await BusinessMember.deleteMany({
          businessId: business._id,
        });
      } catch (cleanupMemberError) {
        // Keep original error.
      }

      try {
        await settingService.removeSettingsForBusiness(business._id);
      } catch (cleanupSettingsError) {
        // Keep original error.
      }

      try {
        await Business.deleteOne({
          _id: business._id,
        });
      } catch (cleanupBusinessError) {
        // Keep original error.
      }
    }

    throw error;
  }
};

/* ============================================================
 * GET BUSINESS BY ID
 * ============================================================ */

const getBusinessById = async (businessId) => {
  const business = await Business.findById(businessId);

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  return business;
};

/* ============================================================
 * GET BUSINESS FOR USER
 * ============================================================ */

const getBusinessByIdForUser = async (businessId, userId) => {
  const business = await Business.findById(businessId);

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  if (String(business.ownerId || "") !== String(userId)) {
    throw new ApiError(403, "Only the business owner can view business details.");
  }

  return business;
};

/* ============================================================
 * GET BUSINESSES BY OWNER
 * ============================================================ */

const getBusinessesByOwner = async (ownerId) => {
  return Business.find({
    ownerId,
  }).sort({
    createdAt: -1,
  });
};

/* ============================================================
 * UPDATE BUSINESS
 * ============================================================ */

const updateBusiness = async (businessId, userId, updates) => {
  const business = await getBusinessByIdForUser(businessId, userId);

  const allowedFields = ["name", "legalName", "businessType", "industry", "description", "logo", "website", "email", "phone", "address", "timezone", "currency", "dateFormat", "timeFormat", "settings", "onboardingCompleted"];

  const updateData = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      updateData[field] = updates[field];
    }
  }

  /* ========================================================
   * NORMALIZE TIME FORMAT
   *
   * Accept both frontend forms:
   * "12h" / "12h"
   * "24h" / "24h"
   *
   * Store only:
   * "12h" / "24h"
   * ======================================================== */

  if (Object.prototype.hasOwnProperty.call(updateData, "timeFormat")) {
    const normalizedTimeFormat = String(updateData.timeFormat || "")
      .trim()
      .toUpperCase();

    if (!["12h", "24h"].includes(normalizedTimeFormat)) {
      throw new ApiError(400, "Invalid time format. Allowed values are 12h or 24h.");
    }

    updateData.timeFormat = normalizedTimeFormat;
  }

  /* ========================================================
   * GENERATE NEW SLUG IF BUSINESS NAME CHANGES
   * ======================================================== */

  if (Object.prototype.hasOwnProperty.call(updateData, "name") && updateData.name !== business.name) {
    updateData.slug = await generateUniqueSlug(updateData.name, businessId);
  }

  updateData.updatedBy = userId;

  Object.assign(business, updateData);

  await business.save();

  return business;
};

/* ============================================================
 * UPDATE BUSINESS STATUS
 * ============================================================ */

const updateBusinessStatus = async (businessId, userId, status) => {
  const allowedStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid business status.");
  }

  const business = await getBusinessByIdForUser(businessId, userId);

  business.status = status;
  business.updatedBy = userId;

  await business.save();

  return business;
};

/* ============================================================
 * EXPORTS
 * ============================================================ */

module.exports = {
  normalizeSlug,
  generateUniqueSlug,
  createBusiness,
  getBusinessById,
  getBusinessByIdForUser,
  getBusinessesByOwner,
  updateBusiness,
  updateBusinessStatus,
};
