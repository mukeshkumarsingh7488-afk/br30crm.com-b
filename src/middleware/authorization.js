const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");
const BusinessMember = require("../modules/business-members/business-member.model");
const Business = require("../modules/businesses/business.model");
const env = require("../config/env");

/*
 * ============================================================
 * MASTER ADMIN AUTHORIZATION
 * ============================================================
 *
 * Master Admin is identified ONLY by User._id.
 *
 * MASTER_ADMIN_USER_ID comes from .env
 *
 * Master Admin:
 * - Does NOT require business membership
 * - Does NOT require CRM role
 * - Does NOT require CRM permission
 * - Has full system-level access
 *
 * Normal CRM authorization remains separate.
 * ============================================================
 */

const requireMasterAdmin = (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return next(new ApiError(401, "Authentication required."));
    }

    const masterAdminUserId = env.masterAdminUserId;

    if (!masterAdminUserId) {
      return next(new ApiError(500, "Master Admin is not configured."));
    }

    if (!mongoose.Types.ObjectId.isValid(masterAdminUserId)) {
      return next(new ApiError(500, "Master Admin User ID configuration is invalid."));
    }

    if (req.user.userId.toString() !== masterAdminUserId.toString()) {
      return next(new ApiError(403, "Master Admin access required."));
    }

    req.isMasterAdmin = true;

    return next();
  } catch (error) {
    return next(error);
  }
};

/*
 * ============================================================
 * BUSINESS ID RESOLUTION
 * ============================================================
 *
 * Business ID can come from:
 *
 * 1. URL params
 * 2. Request body
 * 3. Query string
 * 4. x-business-id header
 *
 * If no explicit business ID is supplied:
 *
 * - Find active memberships for logged-in user.
 * - If exactly one active business exists, use it automatically.
 * - If multiple active businesses exist, require explicit
 *   business selection.
 *
 * This allows normal single-business CRM routes such as:
 *
 * GET /leads
 *
 * without forcing the frontend to send businessId on every
 * request.
 * ============================================================
 */

const resolveBusinessId = async (req) => {
  let businessId = req.params?.businessId || req.body?.businessId || req.query?.businessId || req.headers["x-business-id"];

  /*
   * Normalize header/query/body values.
   */
  if (typeof businessId === "string") {
    businessId = businessId.trim();
  }

  /*
   * ----------------------------------------------------------
   * Explicit business ID was supplied.
   * ----------------------------------------------------------
   */
  if (businessId) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, "Invalid business ID.");
    }

    return businessId.toString();
  }

  /*
   * ----------------------------------------------------------
   * No explicit business ID.
   *
   * Resolve from user's active memberships.
   * ----------------------------------------------------------
   */

  const memberships = await BusinessMember.find({
    userId: req.user.userId,
    status: "ACTIVE",
  })
    .select("businessId roleId status")
    .lean();

  /*
   * No active business membership.
   */
  if (!memberships.length) {
    throw new ApiError(403, "You are not an active member of any business.");
  }

  /*
   * ----------------------------------------------------------
   * One active business.
   *
   * This is the normal case for the current CRM onboarding
   * flow, so automatically use that business.
   * ----------------------------------------------------------
   */

  const uniqueBusinessIds = [...new Set(memberships.filter((member) => member.businessId).map((member) => member.businessId.toString()))];

  if (uniqueBusinessIds.length === 1) {
    return uniqueBusinessIds[0];
  }

  /*
   * ----------------------------------------------------------
   * Multiple active businesses.
   *
   * Do not guess the tenant/business.
   * ----------------------------------------------------------
   */

  if (uniqueBusinessIds.length > 1) {
    throw new ApiError(400, "Business ID is required because you are a member of multiple businesses.");
  }

  throw new ApiError(403, "You are not an active member of any business.");
};

/*
 * ============================================================
 * BUSINESS MEMBERSHIP AUTHORIZATION
 * ============================================================
 *
 * This middleware is for normal business/CRM access.
 *
 * It checks:
 * - authenticated user
 * - business ID
 * - active business membership
 * - assigned role
 * - active role
 *
 * Master Admin does NOT automatically bypass this middleware.
 * Master Admin-only routes should use requireMasterAdmin.
 * ============================================================
 */

const requireBusinessMembership = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return next(new ApiError(401, "Authentication required."));
    }

    /*
     * ==========================================================
     * DEBUG - AUTHORIZATION START
     * ==========================================================
     */

    /*
     * ----------------------------------------------------------
     * Resolve business ID.
     * ----------------------------------------------------------
     */
    const businessId = await resolveBusinessId(req);
    /*
     * Resolve the business before role validation.
     * This gives us one authoritative owner check and prevents
     * a stale/missing role from blocking the actual business owner.
     */
    const business = await Business.findById(businessId).select("_id ownerId status").lean();

    if (!business) {
      return next(new ApiError(404, "Business not found."));
    }

    const isBusinessOwner = String(business.ownerId || "") === String(req.user.userId);

    const membershipQuery = {
      businessId,
      userId: req.user.userId,
      status: "ACTIVE",
    };

    const member = await BusinessMember.findOne(membershipQuery)
      .populate("roleId", "name slug description type permissions isActive businessId")
      .lean();

    /*
     * Business Owner is the authoritative tenant owner.
     * Do not require a role record for the owner; the permission
     * middleware uses req.isBusinessOwner for full CRM access.
     */
    if (isBusinessOwner) {
      req.isBusinessOwner = true;
      req.business = {
        id: businessId.toString(),
        ownerId: business.ownerId ? business.ownerId.toString() : null,
        status: business.status,
      };
      req.businessMember = member || null;
      req.role = member?.roleId || null;
      req.businessId = businessId.toString();
      req.businessMemberId = member?._id || null;
      req.roleId = member?.roleId?._id || null;
      return next();
    }

    if (!member) {
      return next(new ApiError(403, "You do not have access to this business."));
    }

    if (!member.roleId) {
      return next(new ApiError(403, "Permission denied."));
    }

    if (!member.roleId.isActive) {
      return next(new ApiError(403, "Permission denied."));
    }

    if (member.roleId.type === "CUSTOM" && member.roleId.businessId && member.roleId.businessId.toString() !== businessId.toString()) {
      return next(new ApiError(403, "Permission denied."));
    }

    req.isBusinessOwner = false;
    req.business = {
      id: businessId.toString(),
      ownerId: business.ownerId ? business.ownerId.toString() : null,
      status: business.status,
    };
    req.businessMember = member;
    req.role = member.roleId;
    req.businessId = businessId.toString();
    req.businessMemberId = member._id;
    req.roleId = member.roleId._id;

    return next();
  } catch (error) {
    console.error("BUSINESS AUTHORIZATION ERROR:", error);
    return next(error);
  }
};


/*
 * ============================================================
 * BUSINESS OWNER AUTHORIZATION
 * ============================================================
 *
 * Used for tenant-level business administration endpoints.
 * The owner is resolved from Business.ownerId and never from
 * client supplied role/permission data.
 * ============================================================
 */
const requireBusinessOwner = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return next(new ApiError(401, "Authentication required."));
    }

    const businessId = await resolveBusinessId(req);
    const business = await Business.findById(businessId).select("_id ownerId status").lean();

    if (!business) {
      return next(new ApiError(404, "Business not found."));
    }

    if (String(business.ownerId || "") !== String(req.user.userId)) {
      return next(new ApiError(403, "Business Owner access required."));
    }

    req.businessId = businessId.toString();
    req.business = {
      id: businessId.toString(),
      ownerId: business.ownerId ? business.ownerId.toString() : null,
      status: business.status,
    };
    req.isBusinessOwner = true;

    return next();
  } catch (error) {
    return next(error);
  }
};

/*
 * ============================================================
 * MASTER ADMIN CHECK HELPER
 * ============================================================
 *
 * Useful inside controllers/services when we need to know
 * whether the current request belongs to Master Admin.
 *
 * This does NOT send a response and does NOT act as middleware.
 * ============================================================
 */

const isMasterAdmin = (req) => {
  return req?.isMasterAdmin === true;
};

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  requireMasterAdmin,
  requireBusinessMembership,
  requireBusinessOwner,
  isMasterAdmin,
};
