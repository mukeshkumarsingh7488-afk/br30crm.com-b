const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const activityService = require("./activity.service");

/*
 * Create activity
 */
const createActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.createActivity({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { activity }, "Activity created successfully.");
});

/*
 * Get activities by business
 */
const getActivitiesByBusiness = asyncHandler(async (req, res) => {
  const result = await activityService.getActivitiesByBusiness(req.params.businessId, { ...req.query, access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name } });

  return ApiResponse.success(res, result, "Activities fetched successfully.");
});

/*
 * Get activity by ID
 */
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.activityId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { activity }, "Activity fetched successfully.");
});

/*
 * Update activity
 */
const updateActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.updateActivity(req.params.activityId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { activity }, "Activity updated successfully.");
});

/*
 * Complete activity
 */
const completeActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.completeActivity(req.params.activityId, req.params.businessId, req.body.outcome, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { activity }, "Activity completed successfully.");
});

/*
 * Delete activity
 */
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.deleteActivity(req.params.activityId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { activity }, "Activity deleted successfully.");
});

module.exports = {
  createActivity,
  getActivitiesByBusiness,
  getActivityById,
  updateActivity,
  completeActivity,
  deleteActivity,
};
