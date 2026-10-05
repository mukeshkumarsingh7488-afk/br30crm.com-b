const mongoose = require("mongoose");

const Team = require("./team.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const User = require("../users/user.model");

const ApiError = require("../../utils/ApiError");

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const normalizeSlug = (value) => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (name, businessId, excludeTeamId = null) => {
  const baseSlug = normalizeSlug(name);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = {
      businessId,
      slug,
    };

    if (excludeTeamId) {
      query._id = { $ne: excludeTeamId };
    }

    const existingTeam = await Team.findOne(query).select("_id").lean();

    if (!existingTeam) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

const getBusiness = async (businessId) => {
  validateObjectId(businessId, "business ID");

  const business = await Business.findById(businessId).select("_id name status").lean();

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  if (business.status !== "ACTIVE") {
    throw new ApiError(400, "Business is not active.");
  }

  return business;
};

const verifyBusinessMember = async (businessId, userId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");

  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  })
    .select("_id businessId userId roleId status")
    .lean();

  if (!member) {
    throw new ApiError(400, "User is not an active member of this business.");
  }

  return member;
};

const getTeamById = async (teamId) => {
  validateObjectId(teamId, "team ID");

  const team = await Team.findById(teamId).populate("managerId", "name email phone profileImage status").populate("members", "name email phone profileImage status").lean();

  if (!team) {
    throw new ApiError(404, "Team not found.");
  }

  return team;
};

const getTeamByIdForBusiness = async (teamId, businessId) => {
  validateObjectId(teamId, "team ID");
  validateObjectId(businessId, "business ID");

  const team = await Team.findOne({
    _id: teamId,
    businessId,
  })
    .populate("managerId", "name email phone profileImage status")
    .populate("members", "name email phone profileImage status")
    .lean();

  if (!team) {
    throw new ApiError(404, "Team not found for this business.");
  }

  return team;
};

const createTeam = async ({ businessId, name, description, managerId = null, members = [], createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "user ID");

  await getBusiness(businessId);

  if (!name || !name.trim()) {
    throw new ApiError(400, "Team name is required.");
  }

  if (!Array.isArray(members)) {
    throw new ApiError(400, "Members must be an array.");
  }

  const uniqueMemberIds = [...new Set(members.map((memberId) => memberId.toString()))];

  for (const userId of uniqueMemberIds) {
    await verifyBusinessMember(businessId, userId);
  }

  if (managerId) {
    await verifyBusinessMember(businessId, managerId);
  }

  const slug = await generateUniqueSlug(name, businessId);

  const team = await Team.create({
    businessId,
    name: name.trim(),
    slug,
    description: description?.trim() || null,
    managerId: managerId || null,
    members: uniqueMemberIds,
    status: "ACTIVE",
    createdBy,
    updatedBy: createdBy,
  });

  return getTeamById(team._id);
};

const getTeamsByBusiness = async (businessId, options = {}) => {
  validateObjectId(businessId, "business ID");

  await getBusiness(businessId);

  const query = {
    businessId,
  };

  if (options.includeInactive !== true) {
    query.status = "ACTIVE";
  }

  if (options.search) {
    query.$or = [
      {
        name: {
          $regex: options.search,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: options.search,
          $options: "i",
        },
      },
    ];
  }

  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);

  const skip = (page - 1) * limit;

  const [teams, total] = await Promise.all([Team.find(query).populate("managerId", "name email phone profileImage status").populate("members", "name email phone profileImage status").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Team.countDocuments(query)]);

  return {
    teams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const updateTeam = async (teamId, businessId, updates, updatedBy) => {
  validateObjectId(teamId, "team ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "user ID");

  await getBusiness(businessId);

  const team = await Team.findOne({
    _id: teamId,
    businessId,
  });

  if (!team) {
    throw new ApiError(404, "Team not found for this business.");
  }

  const allowedUpdates = {};

  if (updates.name !== undefined) {
    if (!updates.name || !updates.name.trim()) {
      throw new ApiError(400, "Team name cannot be empty.");
    }

    allowedUpdates.name = updates.name.trim();

    if (allowedUpdates.name !== team.name) {
      allowedUpdates.slug = await generateUniqueSlug(allowedUpdates.name, businessId, teamId);
    }
  }

  if (updates.description !== undefined) {
    allowedUpdates.description = updates.description?.trim() || null;
  }

  if (updates.managerId !== undefined) {
    if (updates.managerId === null || updates.managerId === "") {
      allowedUpdates.managerId = null;
    } else {
      await verifyBusinessMember(businessId, updates.managerId);

      allowedUpdates.managerId = updates.managerId;
    }
  }

  if (updates.members !== undefined) {
    if (!Array.isArray(updates.members)) {
      throw new ApiError(400, "Members must be an array.");
    }

    const uniqueMemberIds = [...new Set(updates.members.map((memberId) => memberId.toString()))];

    for (const userId of uniqueMemberIds) {
      await verifyBusinessMember(businessId, userId);
    }

    allowedUpdates.members = uniqueMemberIds;
  }

  if (updates.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(updates.status)) {
      throw new ApiError(400, "Invalid team status.");
    }

    allowedUpdates.status = updates.status;
  }

  allowedUpdates.updatedBy = updatedBy;

  const updatedTeam = await Team.findByIdAndUpdate(teamId, allowedUpdates, {
    returnDocument: "after",
    runValidators: true,
  });

  return getTeamById(updatedTeam._id);
};

const deleteTeam = async (teamId, businessId, deletedBy) => {
  validateObjectId(teamId, "team ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(deletedBy, "user ID");

  await getBusiness(businessId);

  const team = await Team.findOne({
    _id: teamId,
    businessId,
  });

  if (!team) {
    throw new ApiError(404, "Team not found for this business.");
  }

  team.status = "INACTIVE";
  team.updatedBy = deletedBy;

  await team.save();

  return getTeamById(team._id);
};

const addTeamMember = async (teamId, businessId, userId, updatedBy) => {
  validateObjectId(teamId, "team ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");
  validateObjectId(updatedBy, "user ID");

  await getBusiness(businessId);
  await verifyBusinessMember(businessId, userId);

  const team = await Team.findOne({
    _id: teamId,
    businessId,
  });

  if (!team) {
    throw new ApiError(404, "Team not found for this business.");
  }

  const alreadyMember = team.members.some((memberId) => memberId.toString() === userId.toString());

  if (alreadyMember) {
    throw new ApiError(409, "User is already a member of this team.");
  }

  team.members.push(userId);
  team.updatedBy = updatedBy;

  await team.save();

  return getTeamById(team._id);
};

const removeTeamMember = async (teamId, businessId, userId, updatedBy) => {
  validateObjectId(teamId, "team ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");
  validateObjectId(updatedBy, "user ID");

  const team = await Team.findOne({
    _id: teamId,
    businessId,
  });

  if (!team) {
    throw new ApiError(404, "Team not found for this business.");
  }

  const memberExists = team.members.some((memberId) => memberId.toString() === userId.toString());

  if (!memberExists) {
    throw new ApiError(404, "User is not a member of this team.");
  }

  team.members = team.members.filter((memberId) => memberId.toString() !== userId.toString());

  if (team.managerId && team.managerId.toString() === userId.toString()) {
    team.managerId = null;
  }

  team.updatedBy = updatedBy;

  await team.save();

  return getTeamById(team._id);
};

module.exports = {
  validateObjectId,
  normalizeSlug,
  generateUniqueSlug,
  getBusiness,
  verifyBusinessMember,
  getTeamById,
  getTeamByIdForBusiness,
  createTeam,
  getTeamsByBusiness,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
};
