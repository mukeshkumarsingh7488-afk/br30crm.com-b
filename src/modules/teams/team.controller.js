const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const teamService = require("./team.service");

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { team }, "Team created successfully.");
});

const getTeamsByBusiness = asyncHandler(async (req, res) => {
  const result = await teamService.getTeamsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(res, result, "Business teams fetched successfully.");
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamByIdForBusiness(req.params.teamId, req.params.businessId);

  return ApiResponse.success(res, { team }, "Team fetched successfully.");
});

const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.teamId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { team }, "Team updated successfully.");
});

const deleteTeam = asyncHandler(async (req, res) => {
  const team = await teamService.deleteTeam(req.params.teamId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { team }, "Team deactivated successfully.");
});

const addTeamMember = asyncHandler(async (req, res) => {
  const team = await teamService.addTeamMember(req.params.teamId, req.params.businessId, req.params.userId, req.user.userId);

  return ApiResponse.success(res, { team }, "Team member added successfully.");
});

const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await teamService.removeTeamMember(req.params.teamId, req.params.businessId, req.params.userId, req.user.userId);

  return ApiResponse.success(res, { team }, "Team member removed successfully.");
});

module.exports = {
  createTeam,
  getTeamsByBusiness,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
};
