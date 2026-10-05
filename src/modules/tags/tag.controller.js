const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const tagService = require("./tag.service");

const createTag = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { tag }, "Tag created successfully.");
});

const getTagsByBusiness = asyncHandler(async (req, res) => {
  const result = await tagService.getTagsByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    type: req.query.type,
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(res, result, "Tags fetched successfully.");
});

const getTagById = asyncHandler(async (req, res) => {
  const tag = await tagService.getTagById(req.params.tagId, req.params.businessId);

  return ApiResponse.success(res, { tag }, "Tag fetched successfully.");
});

const updateTag = asyncHandler(async (req, res) => {
  const tag = await tagService.updateTag(req.params.tagId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { tag }, "Tag updated successfully.");
});

const deleteTag = asyncHandler(async (req, res) => {
  const tag = await tagService.deleteTag(req.params.tagId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { tag }, "Tag deactivated successfully.");
});

const restoreTag = asyncHandler(async (req, res) => {
  const tag = await tagService.restoreTag(req.params.tagId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { tag }, "Tag restored successfully.");
});

module.exports = {
  createTag,
  getTagsByBusiness,
  getTagById,
  updateTag,
  deleteTag,
  restoreTag,
};
