const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const BusinessMember = require("./business-member.model");
const Business = require("../businesses/business.model");
const User = require("../users/user.model");

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const getBusiness = async (businessId) => {
  validateObjectId(businessId, "business ID");

  const business = await Business.findById(businessId);

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  return business;
};

const getUser = async (userId) => {
  validateObjectId(userId, "user ID");

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return user;
};

const getMemberById = async (memberId) => {
  validateObjectId(memberId, "member ID");

  const member = await BusinessMember.findById(memberId).populate("userId", "name email phone profileImage status").populate("businessId", "name slug status").populate("roleId", "name slug");

  if (!member) {
    throw new ApiError(404, "Business member not found.");
  }

  return member;
};

const getMembership = async (businessId, userId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");

  return BusinessMember.findOne({
    businessId,
    userId,
  });
};

const isBusinessOwner = async (businessId, userId) => {
  const business = await Business.findOne({
    _id: businessId,
    ownerId: userId,
  }).select("_id");

  return Boolean(business);
};

const addMember = async ({ businessId, userId, roleId = null, status = "ACTIVE", invitedBy = null, createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");

  if (roleId) {
    validateObjectId(roleId, "role ID");
  }

  if (createdBy) {
    validateObjectId(createdBy, "creator ID");
  }

  if (invitedBy) {
    validateObjectId(invitedBy, "inviter ID");
  }

  const business = await getBusiness(businessId);
  const user = await getUser(userId);

  if (business.status !== "ACTIVE") {
    throw new ApiError(400, "Members cannot be added to an inactive or suspended business.");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(400, "Inactive or suspended users cannot be added as members.");
  }

  const existingMember = await BusinessMember.findOne({
    businessId,
    userId,
  });

  if (existingMember) {
    throw new ApiError(409, "This user is already a member of the business.");
  }

  const member = await BusinessMember.create({
    businessId,
    userId,
    roleId,
    status,
    invitedBy,
    createdBy: createdBy || userId,
  });

  return getMemberById(member._id);
};

const getAssignmentMembersByBusiness = async (businessId, { page = 1, limit = 100 } = {}) => {
  validateObjectId(businessId, "business ID");
  await getBusiness(businessId);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const filter = { businessId, status: "ACTIVE" };
  const skip = (safePage - 1) * safeLimit;

  const [members, total] = await Promise.all([
    BusinessMember.find(filter)
      .populate("userId", "name firstName lastName email phone profileImage status")
      .populate("roleId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    BusinessMember.countDocuments(filter),
  ]);

  return {
    members,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getMembersByBusiness = async (businessId, { status = null, page = 1, limit = 20 } = {}) => {
  validateObjectId(businessId, "business ID");

  await getBusiness(businessId);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
  };

  if (status) {
    filter.status = status;
  }

  const skip = (safePage - 1) * safeLimit;

  const [members, total] = await Promise.all([BusinessMember.find(filter).populate("userId", "name email phone profileImage status emailVerified").populate("roleId", "name slug").sort({ createdAt: -1 }).skip(skip).limit(safeLimit), BusinessMember.countDocuments(filter)]);

  return {
    members,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getBusinessesByUser = async (userId, { status = "ACTIVE", page = 1, limit = 20 } = {}) => {
  validateObjectId(userId, "user ID");

  await getUser(userId);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    userId,
  };

  if (status) {
    filter.status = status;
  }

  const skip = (safePage - 1) * safeLimit;

  const [members, total] = await Promise.all([
    BusinessMember.find(filter)
      .populate("businessId", "name slug legalName businessType industry logo website status timezone currency ownerId")
      .populate({
        path: "roleId",
        select: "name slug type permissions isActive",
        populate: {
          path: "permissions",
          select: "slug module action type businessId isActive",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),

    BusinessMember.countDocuments(filter),
  ]);

  return {
    memberships: members,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const updateMember = async (memberId, updates, updatedBy) => {
  validateObjectId(memberId, "member ID");
  validateObjectId(updatedBy, "updater ID");

  const member = await BusinessMember.findById(memberId);

  if (!member) {
    throw new ApiError(404, "Business member not found.");
  }

  const allowedFields = ["roleId", "status"];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      if (field === "roleId" && updates[field] !== null) {
        validateObjectId(updates[field], "role ID");
      }

      member[field] = updates[field];
    }
  }

  member.updatedBy = updatedBy;

  await member.save();

  return getMemberById(member._id);
};

const removeMember = async (memberId, removedBy) => {
  validateObjectId(memberId, "member ID");
  validateObjectId(removedBy, "remover ID");

  const member = await BusinessMember.findById(memberId);

  if (!member) {
    throw new ApiError(404, "Business member not found.");
  }

  const business = await Business.findById(member.businessId).select("ownerId");

  if (business && business.ownerId.toString() === member.userId.toString()) {
    throw new ApiError(400, "The business owner cannot be removed from the business.");
  }

  member.status = "INACTIVE";
  member.updatedBy = removedBy;

  await member.save();

  return getMemberById(member._id);
};

const checkUserMembership = async (businessId, userId) => {
  const member = await getMembership(businessId, userId);

  if (!member || member.status !== "ACTIVE") {
    return null;
  }

  return member;
};

module.exports = {
  validateObjectId,
  getBusiness,
  getUser,
  getMemberById,
  getMembership,
  isBusinessOwner,
  addMember,
  getAssignmentMembersByBusiness,
  getMembersByBusiness,
  getBusinessesByUser,
  updateMember,
  removeMember,
  checkUserMembership,
};
