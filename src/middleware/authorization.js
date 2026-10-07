const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");
const BusinessMember = require("../modules/business-members/business-member.model");
const Business = require("../modules/businesses/business.model");
const env = require("../config/env");

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

const resolveBusinessId = async (req) => {
  let businessId = req.params?.businessId || req.body?.businessId || req.query?.businessId || req.headers["x-business-id"];

  if (typeof businessId === "string") {
    businessId = businessId.trim();
  }

  if (businessId) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, "Invalid business ID.");
    }

    return businessId.toString();
  }

  const memberships = await BusinessMember.find({
    userId: req.user.userId,
    status: "ACTIVE",
  })
    .select("businessId roleId status")
    .lean();

  if (!memberships.length) {
    throw new ApiError(403, "You are not an active member of any business.");
  }

  const uniqueBusinessIds = [...new Set(memberships.filter((member) => member.businessId).map((member) => member.businessId.toString()))];

  if (uniqueBusinessIds.length === 1) {
    return uniqueBusinessIds[0];
  }

  if (uniqueBusinessIds.length > 1) {
    throw new ApiError(400, "Business ID is required because you are a member of multiple businesses.");
  }

  throw new ApiError(403, "You are not an active member of any business.");
};

const requireBusinessMembership = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return next(new ApiError(401, "Authentication required."));
    }

    const businessId = await resolveBusinessId(req);

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

    const member = await BusinessMember.findOne(membershipQuery).populate("roleId", "name slug description type permissions isActive businessId").lean();

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
    return next(error);
  }
};

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

const isMasterAdmin = (req) => {
  return req?.isMasterAdmin === true;
};

module.exports = {
  requireMasterAdmin,
  requireBusinessMembership,
  requireBusinessOwner,
  isMasterAdmin,
};
