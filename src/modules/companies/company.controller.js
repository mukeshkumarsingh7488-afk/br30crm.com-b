const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const companyService = require("./company.service");

const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.createCompany({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { company }, "Company created successfully.");
});

const getCompaniesByBusiness = asyncHandler(async (req, res) => {
  const result = await companyService.getCompaniesByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    industry: req.query.industry,
    companySize: req.query.companySize,
    source: req.query.source,
    assignedTo: req.query.assignedTo,
    assignedTeamId: req.query.assignedTeamId,
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Business companies fetched successfully.");
});

const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyByIdForBusiness(req.params.companyId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { company }, "Company fetched successfully.");
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(req.params.companyId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { company }, "Company updated successfully.");
});

const assignCompany = asyncHandler(async (req, res) => {
  const company = await companyService.assignCompany(req.params.companyId, req.params.businessId, req.body.assignedTo, req.body.assignedTeamId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { company }, "Company assigned successfully.");
});

const getCompanyContacts = asyncHandler(async (req, res) => {
  const result = await companyService.getCompanyContacts(req.params.companyId, req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Company contacts fetched successfully.");
});

const deleteCompany = asyncHandler(async (req, res) => {
  const result = await companyService.deleteCompany(req.params.companyId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, result, "Company deleted successfully.");
});

module.exports = {
  createCompany,
  getCompaniesByBusiness,
  getCompanyById,
  updateCompany,
  assignCompany,
  getCompanyContacts,
  deleteCompany,
};
