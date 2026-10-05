const Team = require("../modules/teams/team.model");
const ApiError = require("./ApiError");

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");

const isManagerRole = (roleSlug, roleName) => {
  const slug = normalize(roleSlug);
  const name = normalize(roleName);
  return slug === "manager" || slug === "team-manager" || slug === "teammanager" || slug.endsWith("-manager") || name === "manager" || name === "team-manager" || name.endsWith("-manager");
};

const resolveRecordAccess = async (businessId, { userId, isBusinessOwner = false, roleSlug = "", roleName = "" } = {}) => {
  if (isBusinessOwner) {
    return { userId, fullAccess: true, teamIds: [] };
  }

  if (!userId) throw new ApiError(401, "Authentication required.");

  if (isManagerRole(roleSlug, roleName)) {
    return { userId, fullAccess: true, teamIds: [] };
  }

  const managedTeamIds = await Team.find({ businessId, managerId: userId, status: { $in: ["ACTIVE", "INACTIVE"] } }).distinct("_id");

  if (managedTeamIds.length) {
    return { userId, fullAccess: true, teamIds: managedTeamIds };
  }

  const teamIds = await Team.find({ businessId, members: userId, status: "ACTIVE" }).distinct("_id");

  return { userId, fullAccess: false, teamIds };
};

const applyRecordVisibility = (filter, access, { assignedUserField = "assignedTo", assignedTeamField = "assignedTeamId" } = {}) => {
  if (!access || access.fullAccess) return filter;

  const clauses = [{ [assignedUserField]: access.userId }];
  if (assignedTeamField && Array.isArray(access.teamIds) && access.teamIds.length) {
    clauses.push({ [assignedTeamField]: { $in: access.teamIds } });
  }

  filter.$and = [...(filter.$and || []), { $or: clauses }];
  return filter;
};

const assertRecordAccess = (record, access, { assignedUserField = "assignedTo", assignedTeamField = "assignedTeamId" } = {}) => {
  if (!access || access.fullAccess) return;
  if (!record) throw new ApiError(404, "Record not found.");

  const assignedUser = record?.[assignedUserField]?._id || record?.[assignedUserField];
  const assignedTeam = assignedTeamField ? record?.[assignedTeamField]?._id || record?.[assignedTeamField] : null;

  const userAllowed = assignedUser && String(assignedUser) === String(access.userId);
  const teamAllowed = assignedTeam && access.teamIds?.some((id) => String(id) === String(assignedTeam));

  if (!userAllowed && !teamAllowed) {
    throw new ApiError(403, "You do not have access to this record.");
  }
};

module.exports = { resolveRecordAccess, applyRecordVisibility, assertRecordAccess, isManagerRole };
