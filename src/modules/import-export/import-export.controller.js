const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const service = require("./import-export.service");
const { enqueue } = require("../../jobs/job.service");

const createImport = asyncHandler(async (req, res) => {
  const job = await service.createImport({ businessId: req.params.businessId, userId: req.user.userId, entityType: req.body.entityType, csv: req.body.csv, rows: req.body.rows, fileName: req.body.fileName });
  await enqueue("IMPORT_PROCESS", { jobId: job._id.toString() });
  return ApiResponse.created(res, job, "Import job created successfully.");
});

const list = asyncHandler(async (req, res) => ApiResponse.success(res, await service.list({ businessId: req.params.businessId, page: req.query.page, limit: req.query.limit }), "Import/export jobs fetched successfully."));
const get = asyncHandler(async (req, res) => ApiResponse.success(res, await service.get({ businessId: req.params.businessId, jobId: req.params.jobId }), "Job fetched successfully."));
const exportData = asyncHandler(async (req, res) => ApiResponse.created(res, await service.exportData({ businessId: req.params.businessId, userId: req.user.userId, entityType: req.body.entityType, filter: req.body.filter }), "Export generated successfully."));
const download = asyncHandler(async (req, res) => {
  const result = await service.download({ businessId: req.params.businessId, jobId: req.params.jobId });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
  return res.status(200).send(result.csv);
});

module.exports = { createImport, list, get, exportData, download };
