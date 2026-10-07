const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./report.service");

const create = asyncHandler(async (req, res) =>
  ApiResponse.created(
    res,
    await s.create({
      businessId: req.params.businessId,
      userId: req.user.userId,
      data: req.body,
    }),
    "Report created successfully."
  )
);

const list = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.list({
      businessId: req.params.businessId,
      page: req.query.page,
      limit: req.query.limit,
    }),
    "Reports fetched successfully."
  )
);

const run = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.run({
      businessId: req.params.businessId,
      reportId: req.params.reportId,
      overrideFilters: req.body?.filters || {},
    }),
    "Report executed successfully."
  )
);

const sales = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.getSalesReport({
      businessId: req.params.businessId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status,
      source: req.query.source,
      assignedTo: req.query.assignedTo,
    }),
    "Sales report fetched successfully."
  )
);

const leads = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.getLeadsReport({
      businessId: req.params.businessId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status,
      source: req.query.source,
      assignedTo: req.query.assignedTo,
    }),
    "Leads report fetched successfully."
  )
);

const deals = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.getDealsReport({
      businessId: req.params.businessId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status,
      source: req.query.source,
      assignedTo: req.query.assignedTo,
    }),
    "Deals report fetched successfully."
  )
);

const activities = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.getActivitiesReport({
      businessId: req.params.businessId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      type: req.query.type,
      status: req.query.status,
      assignedTo: req.query.assignedTo,
    }),
    "Activities report fetched successfully."
  )
);

const update = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.update({
      businessId: req.params.businessId,
      reportId: req.params.reportId,
      userId: req.user.userId,
      data: req.body,
    }),
    "Report updated successfully."
  )
);

const remove = asyncHandler(async (req, res) =>
  ApiResponse.success(
    res,
    await s.remove({
      businessId: req.params.businessId,
      reportId: req.params.reportId,
    }),
    "Report deleted successfully."
  )
);

module.exports = {
  create,
  list,
  run,
  sales,
  leads,
  deals,
  activities,
  update,
  remove,
};
