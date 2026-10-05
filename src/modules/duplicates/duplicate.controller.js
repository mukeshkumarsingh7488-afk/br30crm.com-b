const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const service = require("./duplicate.service");

const detect = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await service.detect({
      businessId: req.params.businessId,
      entityType: req.body.entityType,
      createdBy: req.user.userId,
    }),
    "Duplicate scan completed."
  )
);
const list = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await service.list({
      businessId: req.params.businessId,
      status: req.query.status,
      entityType: req.query.entityType,
      page: req.query.page,
      limit: req.query.limit,
    }),
    "Duplicates fetched successfully."
  )
);
const resolve = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await service.resolve({
      businessId: req.params.businessId,
      duplicateId: req.params.duplicateId,
      action: req.body.action,
      userId: req.user.userId,
    }),
    "Duplicate resolved successfully."
  )
);
module.exports = { detect, list, resolve };
