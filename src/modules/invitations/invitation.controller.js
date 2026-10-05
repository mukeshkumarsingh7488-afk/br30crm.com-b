const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const invitationService = require("./invitation.service");

const createInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.createInvitation({
    businessId: req.params.businessId,
    email: req.body.email,
    roleId: req.body.roleId,
    invitedBy: req.user.userId,
  });

  return ApiResponse.created(res, { invitation }, "Invitation created and sent successfully.");
});

const getInvitationsByBusiness = asyncHandler(async (req, res) => {
  const result = await invitationService.getInvitationsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    search: req.query.search,
  });

  return ApiResponse.success(res, result, "Business invitations fetched successfully.");
});

const getInvitationById = asyncHandler(async (req, res) => {
  const invitation = await invitationService.getInvitationById(req.params.invitationId);

  return ApiResponse.success(res, { invitation }, "Invitation fetched successfully.");
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await invitationService.acceptInvitation({
    token: req.body.token,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, result, "Invitation accepted successfully.");
});

const resendInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.resendInvitation({
    invitationId: req.params.invitationId,
    businessId: req.params.businessId,
    resentBy: req.user.userId,
  });

  return ApiResponse.success(res, { invitation }, "Invitation resent successfully.");
});

const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.cancelInvitation({
    invitationId: req.params.invitationId,
    businessId: req.params.businessId,
    cancelledBy: req.user.userId,
  });

  return ApiResponse.success(res, { invitation }, "Invitation cancelled successfully.");
});

module.exports = {
  createInvitation,
  getInvitationsByBusiness,
  getInvitationById,
  acceptInvitation,
  resendInvitation,
  cancelInvitation,
};
