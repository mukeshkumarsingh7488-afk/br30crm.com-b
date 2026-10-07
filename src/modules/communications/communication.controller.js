const asyncHandler = require("../../utils/asyncHandler");

const s = require("./communication.service");

const ApiResponse = require("../../utils/ApiResponse");

exports.send = asyncHandler(async (req, res) => {
  const result = await s.send({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  return ApiResponse.success(res, result, "Communication sent successfully.");
});

exports.list = asyncHandler(async (req, res) => {
  const result = await s.list({
    businessId: req.params.businessId,
    userId: req.user.userId,
    page: req.query.page,
    limit: req.query.limit,
    channel: req.query.channel,
    search: req.query.search,
  });

  return ApiResponse.success(res, result, "Communication history fetched successfully.");
});

exports.senders = asyncHandler(async (req, res) => {
  const result = await s.senderAccounts({
    businessId: req.params.businessId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, result, "Communication senders fetched successfully.");
});
