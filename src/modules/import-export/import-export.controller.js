const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./import-export.service");
const { enqueue } = require("../../jobs/job.service");
const createImport = asyncHandler(async (req, res) => {
  const job = await s.createImport({ businessId: req.params.businessId, userId: req.user.userId, entityType: req.body.entityType, csv: req.body.csv, rows: req.body.rows, fileName: req.body.fileName });
  await enqueue("IMPORT_PROCESS", { jobId: job._id.toString() });
  return ApiResponse.created(res, job, "Import job created successfully.");
});
const list = asyncHandler(async (req, res) => ApiResponse.success(res, await s.list({ businessId: req.params.businessId, page: req.query.page, limit: req.query.limit }), "Import/export jobs fetched successfully."));
const get = asyncHandler(async (req, res) => ApiResponse.success(res, await s.get({ businessId: req.params.businessId, jobId: req.params.jobId }), "Job fetched successfully."));
const exportData = asyncHandler(async (req, res) => ApiResponse.created(res, await s.exportData({ businessId: req.params.businessId, userId: req.user.userId, entityType: req.body.entityType, filter: req.body.filter }), "Export generated successfully."));
module.exports = { createImport, list, get, exportData };
