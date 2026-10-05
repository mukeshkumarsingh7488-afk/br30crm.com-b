const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const userService = require("./user.service");

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.user.userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return ApiResponse.success(res, { user }, "Profile fetched successfully.");
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = {};

  if (req.body.name !== undefined) {
    allowedUpdates.name = req.body.name;
  }

  if (req.body.phone !== undefined) {
    allowedUpdates.phone = req.body.phone || null;
  }

  if (req.body.profileImage !== undefined) {
    allowedUpdates.profileImage = req.body.profileImage || null;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ApiError(400, "No valid profile fields provided.");
  }

  const user = await userService.updateUserById(req.user.userId, allowedUpdates);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return ApiResponse.success(res, { user }, "Profile updated successfully.");
});

module.exports = {
  getMyProfile,
  updateMyProfile,
};
