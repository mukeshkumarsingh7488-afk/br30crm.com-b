const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const dealService = require("./deal.service");

const createDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.createDeal({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { deal }, "Deal created successfully.");
});

const getDealsByBusiness = asyncHandler(async (req, res) => {
  const result = await dealService.getDealsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    pipelineId: req.query.pipelineId,
    stageId: req.query.stageId,
    assignedTo: req.query.assignedTo,
    contactId: req.query.contactId,
    companyId: req.query.companyId,
    includeInactive: req.query.includeInactive === "true",
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Deals fetched successfully.");
});

const getDealById = asyncHandler(async (req, res) => {
  const deal = await dealService.getDealById(req.params.dealId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { deal }, "Deal fetched successfully.");
});

const updateDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.updateDeal(req.params.dealId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { deal }, "Deal updated successfully.");
});

const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.deleteDeal(req.params.dealId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { deal }, "Deal deleted successfully.");
});

const assignDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.assignDeal(req.params.dealId, req.params.businessId, req.body.userId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { deal }, "Deal assigned successfully.");
});

const moveDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.moveDeal(req.params.dealId, req.params.businessId, req.body.stageId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { deal }, "Deal moved successfully.");
});

module.exports = {
  createDeal,
  getDealsByBusiness,
  getDealById,
  updateDeal,
  deleteDeal,
  assignDeal,
  moveDeal,
};
