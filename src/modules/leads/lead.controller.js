const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const leadService = require("./lead.service");

const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { lead }, "Lead created successfully.");
});

const getLeadsByBusiness = asyncHandler(async (req, res) => {
  const result = await leadService.getLeadsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    rating: req.query.rating,
    source: req.query.source,
    assignedTo: req.query.assignedTo,
    assignedTeamId: req.query.assignedTeamId,
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Business leads fetched successfully.");
});

const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadByIdForBusiness(req.params.leadId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { lead }, "Lead fetched successfully.");
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.leadId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { lead }, "Lead updated successfully.");
});

const assignLead = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLead(req.params.leadId, req.params.businessId, req.body.assignedTo, req.body.assignedTeamId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { lead }, "Lead assigned successfully.");
});

const convertLead = asyncHandler(async (req, res) => {
  const result = await leadService.convertLead({
    leadId: req.params.leadId,
    businessId: req.params.businessId,
    companyId: req.body.companyId,
    convertedBy: req.user.userId,
  });

  return ApiResponse.success(res, result, "Lead converted to contact successfully.");
});

const deleteLead = asyncHandler(async (req, res) => {
  const result = await leadService.deleteLead(req.params.leadId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, result, "Lead deleted successfully.");
});

module.exports = {
  createLead,
  getLeadsByBusiness,
  getLeadById,
  updateLead,
  assignLead,
  convertLead,
  deleteLead,
};
