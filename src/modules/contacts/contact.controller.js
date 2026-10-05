const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const contactService = require("./contact.service");

const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.createContact({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { contact }, "Contact created successfully.");
});

const getContactsByBusiness = asyncHandler(async (req, res) => {
  const result = await contactService.getContactsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    lifecycleStage: req.query.lifecycleStage,
    source: req.query.source,
    companyId: req.query.companyId,
    assignedTo: req.query.assignedTo,
    assignedTeamId: req.query.assignedTeamId,
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Business contacts fetched successfully.");
});

const getContactById = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactByIdForBusiness(req.params.contactId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { contact }, "Contact fetched successfully.");
});

const updateContact = asyncHandler(async (req, res) => {
  const contact = await contactService.updateContact(req.params.contactId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { contact }, "Contact updated successfully.");
});

const assignContact = asyncHandler(async (req, res) => {
  const contact = await contactService.assignContact(req.params.contactId, req.params.businessId, req.body.assignedTo, req.body.assignedTeamId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { contact }, "Contact assigned successfully.");
});

const deleteContact = asyncHandler(async (req, res) => {
  const result = await contactService.deleteContact(req.params.contactId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, result, "Contact deleted successfully.");
});

module.exports = {
  createContact,
  getContactsByBusiness,
  getContactById,
  updateContact,
  assignContact,
  deleteContact,
};
