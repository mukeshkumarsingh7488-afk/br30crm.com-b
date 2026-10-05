const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./calendar.service");
exports.list = asyncHandler(async (req, res) => ApiResponse.success(res, await s.list({ businessId: req.params.businessId, userId: req.user.userId, query: req.query }), "Calendar fetched successfully."));
exports.getById = asyncHandler(async (req, res) => ApiResponse.success(res, { event: await s.getById({ businessId: req.params.businessId, userId: req.user.userId, calendarId: req.params.calendarId }) }, "Calendar event fetched successfully."));
exports.create = asyncHandler(async (req, res) => ApiResponse.created(res, { event: await s.create({ businessId: req.params.businessId, userId: req.user.userId, data: req.body }) }, "Calendar event created successfully."));
exports.update = asyncHandler(async (req, res) => ApiResponse.success(res, { event: await s.update({ businessId: req.params.businessId, userId: req.user.userId, calendarId: req.params.calendarId, data: req.body }) }, "Calendar event updated successfully."));
exports.remove = asyncHandler(async (req, res) => ApiResponse.success(res, { event: await s.remove({ businessId: req.params.businessId, userId: req.user.userId, calendarId: req.params.calendarId }) }, "Calendar event deleted successfully."));
