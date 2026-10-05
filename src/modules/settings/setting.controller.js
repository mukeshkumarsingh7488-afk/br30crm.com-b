const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const settingService = require("./setting.service");

const getSettings = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const settings = await settingService.getSettings(businessId, req.user.userId);

  return res.status(200).json(new ApiResponse(200, settings, "Settings fetched successfully"));
});

const createSettings = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const settings = await settingService.createSettings(businessId, req.user.userId, req.body);

  return res.status(201).json(new ApiResponse(201, settings, "Settings created successfully"));
});

const updateSettings = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const settings = await settingService.updateSettings(businessId, req.user.userId, req.body);

  return res.status(200).json(new ApiResponse(200, settings, "Settings updated successfully"));
});

const resetSettings = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const settings = await settingService.resetSettings(businessId, req.user.userId);

  return res.status(200).json(new ApiResponse(200, settings, "Settings reset successfully"));
});

module.exports = {
  getSettings,
  createSettings,
  updateSettings,
  resetSettings,
};
