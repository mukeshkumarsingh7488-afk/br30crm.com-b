const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const pipelineService = require("./pipeline.service");

const createPipeline = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.createPipeline({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { pipeline }, "Pipeline created successfully.");
});

const getPipelinesByBusiness = asyncHandler(async (req, res) => {
  const result = await pipelineService.getPipelinesByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    type: req.query.type,
    status: req.query.status,
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(res, result, "Business pipelines fetched successfully.");
});

const getPipelineById = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.getPipelineByIdForBusiness(req.params.pipelineId, req.params.businessId);

  return ApiResponse.success(res, { pipeline }, "Pipeline fetched successfully.");
});

const updatePipeline = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.updatePipeline(req.params.pipelineId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { pipeline }, "Pipeline updated successfully.");
});

const addStage = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.addStage(req.params.pipelineId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { pipeline }, "Pipeline stage added successfully.");
});

const updateStage = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.updateStage(req.params.pipelineId, req.params.businessId, req.params.stageId, req.body, req.user.userId);

  return ApiResponse.success(res, { pipeline }, "Pipeline stage updated successfully.");
});

const deleteStage = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.deleteStage(req.params.pipelineId, req.params.businessId, req.params.stageId, req.user.userId);

  return ApiResponse.success(res, { pipeline }, "Pipeline stage deleted successfully.");
});

const deletePipeline = asyncHandler(async (req, res) => {
  const pipeline = await pipelineService.deletePipeline(req.params.pipelineId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { pipeline }, "Pipeline deactivated successfully.");
});

module.exports = {
  createPipeline,
  getPipelinesByBusiness,
  getPipelineById,
  updatePipeline,
  addStage,
  updateStage,
  deleteStage,
  deletePipeline,
};
