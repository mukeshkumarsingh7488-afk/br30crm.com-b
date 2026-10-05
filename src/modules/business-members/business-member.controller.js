const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const businessMemberService = require("./business-member.service");

const addMember = asyncHandler(async (req, res) => {
  const member = await businessMemberService.addMember({
    ...req.body,
    businessId: req.params.businessId,
    invitedBy: req.user.userId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { member }, "Business member added successfully.");
});

const getAssignmentMembersByBusiness = asyncHandler(async (req, res) => {
  const result = await businessMemberService.getAssignmentMembersByBusiness(req.params.businessId, {
    page: req.query.page || 1,
    limit: req.query.limit || 100,
  });

  return ApiResponse.success(res, result, "Assignment members fetched successfully.");
});

const getMembersByBusiness = asyncHandler(async (req, res) => {
  const result = await businessMemberService.getMembersByBusiness(req.params.businessId, {
    status: req.query.status || null,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  });

  return ApiResponse.success(res, result, "Business members fetched successfully.");
});

const getMyBusinessMemberships = asyncHandler(async (req, res) => {
  const result = await businessMemberService.getBusinessesByUser(req.user.userId, {
    status: req.query.status || "ACTIVE",
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  });

  return ApiResponse.success(res, result, "Business memberships fetched successfully.");
});

const getMemberById = asyncHandler(async (req, res) => {
  const member = await businessMemberService.getMemberById(req.params.memberId);

  return ApiResponse.success(res, { member }, "Business member fetched successfully.");
});

const updateMember = asyncHandler(async (req, res) => {
  const member = await businessMemberService.updateMember(req.params.memberId, req.body, req.user.userId);

  return ApiResponse.success(res, { member }, "Business member updated successfully.");
});

const removeMember = asyncHandler(async (req, res) => {
  const member = await businessMemberService.removeMember(req.params.memberId, req.user.userId);

  return ApiResponse.success(res, { member }, "Business member removed successfully.");
});

module.exports = {
  addMember,
  getAssignmentMembersByBusiness,
  getMembersByBusiness,
  getMyBusinessMemberships,
  getMemberById,
  updateMember,
  removeMember,
};
