const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./session.service");
const list = asyncHandler(async (req, res) => ApiResponse.success(res, await s.list(req.user.userId), "Sessions fetched successfully."));
const revoke = asyncHandler(async (req, res) => ApiResponse.success(res, await s.revoke({ userId: req.user.userId, sessionId: req.params.sessionId }), "Session revoked successfully."));
const revokeAll = asyncHandler(async (req, res) => ApiResponse.success(res, await s.revokeAll(req.user.userId), "All sessions revoked successfully."));
module.exports = { list, revoke, revokeAll };
