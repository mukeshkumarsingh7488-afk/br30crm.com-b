const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./calendar-availability.service");
exports.get = asyncHandler(async (req, res) => ApiResponse.success(res, { availability: await s.get({ businessId: req.params.businessId, userId: req.user.userId, targetUserId: req.params.userId }) }, "Availability fetched successfully."));
exports.save = asyncHandler(async (req, res) => ApiResponse.success(res, { availability: await s.save({ businessId: req.params.businessId, userId: req.user.userId, targetUserId: req.params.userId, data: req.body }) }, "Availability saved successfully."));
exports.slots = asyncHandler(async (req, res) => ApiResponse.success(res, await s.slots({ businessId: req.params.businessId, userId: req.user.userId, targetUserId: req.params.userId, from: req.query.from, to: req.query.to }), "Availability checked successfully."));
