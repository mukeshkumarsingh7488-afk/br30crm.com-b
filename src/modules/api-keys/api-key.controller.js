const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const apiKeyService = require("./api-key.service");

const createApiKey = asyncHandler(async (req, res) => {
  const result = await apiKeyService.createApiKey({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, result, "API key created successfully. Store the API key securely because it will not be shown again.");
});

const getApiKeysByBusiness = asyncHandler(async (req, res) => {
  const result = await apiKeyService.getApiKeysByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
  });

  return ApiResponse.success(res, result, "Business API keys fetched successfully.");
});

const getApiKeyById = asyncHandler(async (req, res) => {
  const apiKey = await apiKeyService.getApiKeyById(req.params.apiKeyId, req.params.businessId);

  return ApiResponse.success(res, { apiKey }, "API key fetched successfully.");
});

const updateApiKey = asyncHandler(async (req, res) => {
  const apiKey = await apiKeyService.updateApiKey(req.params.apiKeyId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { apiKey }, "API key updated successfully.");
});

const deleteApiKey = asyncHandler(async (req, res) => {
  const result = await apiKeyService.deleteApiKey(req.params.apiKeyId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, result, "API key deleted successfully.");
});

module.exports = {
  createApiKey,
  getApiKeysByBusiness,
  getApiKeyById,
  updateApiKey,
  deleteApiKey,
};
