const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const integrationService = require("./integration.service");

const createIntegration = asyncHandler(async (req, res) => {
  const integration = await integrationService.createIntegration({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { integration }, "Integration created successfully.");
});

const getIntegrationsByBusiness = asyncHandler(async (req, res) => {
  const result = await integrationService.getIntegrationsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    provider: req.query.provider,
    type: req.query.type,
    status: req.query.status,
  });

  return ApiResponse.success(res, result, "Business integrations fetched successfully.");
});

const getIntegrationById = asyncHandler(async (req, res) => {
  const integration = await integrationService.getIntegrationById(req.params.integrationId, req.params.businessId);

  return ApiResponse.success(res, { integration }, "Integration fetched successfully.");
});

const updateIntegration = asyncHandler(async (req, res) => {
  const integration = await integrationService.updateIntegration(req.params.integrationId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { integration }, "Integration updated successfully.");
});

const updateIntegrationStatus = asyncHandler(async (req, res) => {
  const integration = await integrationService.updateIntegrationStatus(req.params.integrationId, req.params.businessId, req.body.status, req.body.errorMessage, req.user.userId);

  return ApiResponse.success(res, { integration }, "Integration status updated successfully.");
});

const deleteIntegration = asyncHandler(async (req, res) => {
  const result = await integrationService.deleteIntegration(req.params.integrationId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, result, "Integration deleted successfully.");
});

module.exports = {
  createIntegration,
  getIntegrationsByBusiness,
  getIntegrationById,
  updateIntegration,
  updateIntegrationStatus,
  deleteIntegration,
};
