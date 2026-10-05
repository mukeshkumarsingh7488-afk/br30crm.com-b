const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const customFieldService = require("./custom-field.service");

const createCustomField = asyncHandler(async (req, res) => {
  const customField = await customFieldService.createCustomField({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { customField }, "Custom field created successfully.");
});

const getCustomFieldsByBusiness = asyncHandler(async (req, res) => {
  const result = await customFieldService.getCustomFieldsByBusiness(req.params.businessId, {
    entity: req.query.entity,
    search: req.query.search,
    includeInactive: req.query.includeInactive === "true",
    page: req.query.page,
    limit: req.query.limit,
  });

  return ApiResponse.success(res, result, "Custom fields fetched successfully.");
});

const getCustomFieldById = asyncHandler(async (req, res) => {
  const customField = await customFieldService.getCustomFieldById(req.params.customFieldId, req.params.businessId);

  return ApiResponse.success(res, { customField }, "Custom field fetched successfully.");
});

const getCustomFieldsByEntity = asyncHandler(async (req, res) => {
  const customFields = await customFieldService.getCustomFieldsByEntity(req.params.businessId, req.params.entity, req.query.includeInactive === "true");

  return ApiResponse.success(
    res,
    {
      customFields,
      count: customFields.length,
    },
    "Entity custom fields fetched successfully."
  );
});

const updateCustomField = asyncHandler(async (req, res) => {
  const customField = await customFieldService.updateCustomField(req.params.customFieldId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { customField }, "Custom field updated successfully.");
});

const deleteCustomField = asyncHandler(async (req, res) => {
  const customField = await customFieldService.deleteCustomField(req.params.customFieldId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { customField }, "Custom field deactivated successfully.");
});

const restoreCustomField = asyncHandler(async (req, res) => {
  const customField = await customFieldService.restoreCustomField(req.params.customFieldId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { customField }, "Custom field restored successfully.");
});

module.exports = {
  createCustomField,
  getCustomFieldsByBusiness,
  getCustomFieldById,
  getCustomFieldsByEntity,
  updateCustomField,
  deleteCustomField,
  restoreCustomField,
};
