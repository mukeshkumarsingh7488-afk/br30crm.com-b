const analyticsService = require("./analytics.service");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const getOverview = asyncHandler(async (req, res) => {
  const result = await analyticsService.getOverview({
    businessId: req.params.businessId,
    userId: req.user.userId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  });

  return res.status(200).json(new ApiResponse(200, result, "Analytics overview fetched successfully"));
});

const getMetric = asyncHandler(async (req, res) => {
  const result = await analyticsService.getMetric({
    businessId: req.params.businessId,
    userId: req.user.userId,
    metric: req.params.metric,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  });

  return res.status(200).json(new ApiResponse(200, result, "Analytics metric fetched successfully"));
});

const getSnapshots = asyncHandler(async (req, res) => {
  const result = await analyticsService.getSnapshots({
    businessId: req.params.businessId,
    userId: req.user.userId,
    metric: req.query.metric,
    period: req.query.period,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json(new ApiResponse(200, result, "Analytics snapshots fetched successfully"));
});

const getSnapshotById = asyncHandler(async (req, res) => {
  const snapshot = await analyticsService.getSnapshotById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    snapshotId: req.params.snapshotId,
  });

  return res.status(200).json(new ApiResponse(200, snapshot, "Analytics snapshot fetched successfully"));
});

const createSnapshot = asyncHandler(async (req, res) => {
  const snapshot = await analyticsService.createSnapshot({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  return res.status(201).json(new ApiResponse(201, snapshot, "Analytics snapshot created successfully"));
});

const deleteSnapshot = asyncHandler(async (req, res) => {
  const snapshot = await analyticsService.deleteSnapshot({
    businessId: req.params.businessId,
    userId: req.user.userId,
    snapshotId: req.params.snapshotId,
  });

  return res.status(200).json(new ApiResponse(200, snapshot, "Analytics snapshot deleted successfully"));
});

module.exports = {
  getOverview,
  getMetric,
  getSnapshots,
  getSnapshotById,
  createSnapshot,
  deleteSnapshot,
};
