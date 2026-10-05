const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const businessService = require("./business.service");

const createBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const business = await businessService.createBusiness({
    ...req.body,
    ownerId: userId,
    createdBy: userId,
  });

  return ApiResponse.created(res, { business }, "Business created successfully.");
});

const getMyBusinesses = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const businesses = await businessService.getBusinessesByOwner(userId);

  return ApiResponse.success(
    res,
    {
      businesses,
      count: businesses.length,
    },
    "Businesses fetched successfully."
  );
});

const getBusinessById = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { businessId } = req.params;

  const business = await businessService.getBusinessByIdForUser(businessId, userId);

  return ApiResponse.success(res, { business }, "Business fetched successfully.");
});

const updateBusiness = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { businessId } = req.params;

  const business = await businessService.updateBusiness(businessId, userId, req.body);

  return ApiResponse.success(res, { business }, "Business updated successfully.");
});

const updateBusinessStatus = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { businessId } = req.params;
  const { status } = req.body;

  const business = await businessService.updateBusinessStatus(businessId, userId, status);

  return ApiResponse.success(res, { business }, "Business status updated successfully.");
});

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  updateBusinessStatus,
};
