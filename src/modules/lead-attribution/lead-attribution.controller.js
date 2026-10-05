const asyncHandler = require("../../utils/asyncHandler");
const service = require("./lead-attribution.service");

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create({
    businessId: req.params.businessId,
    userId: req.user.userId,
    leadId: req.params.leadId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Lead attribution created",
    data,
  });
});

exports.listByLead = asyncHandler(async (req, res) => {
  const data = await service.listByLead({
    businessId: req.params.businessId,
    userId: req.user.userId,
    leadId: req.params.leadId,
  });

  res.json({
    success: true,
    data,
  });
});

exports.getLeadAttribution = asyncHandler(async (req, res) => {
  const data = await service.getLeadAttribution({
    businessId: req.params.businessId,
    userId: req.user.userId,
    leadId: req.params.leadId,
  });

  res.json({
    success: true,
    data,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.update({
    businessId: req.params.businessId,
    userId: req.user.userId,
    attributionId: req.params.attributionId,
    data: req.body,
  });

  res.json({
    success: true,
    message: "Lead attribution updated",
    data,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await service.remove({
    businessId: req.params.businessId,
    userId: req.user.userId,
    attributionId: req.params.attributionId,
  });

  res.json({
    success: true,
    message: "Lead attribution deleted",
    data,
  });
});

exports.firstTouch = asyncHandler(async (req, res) => {
  const data = await service.firstTouch({
    businessId: req.params.businessId,
    userId: req.user.userId,
    leadId: req.params.leadId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "First-touch attribution saved",
    data,
  });
});

exports.lastTouch = asyncHandler(async (req, res) => {
  const data = await service.lastTouch({
    businessId: req.params.businessId,
    userId: req.user.userId,
    leadId: req.params.leadId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Last-touch attribution saved",
    data,
  });
});

exports.summary = asyncHandler(async (req, res) => {
  const data = await service.summary({
    businessId: req.params.businessId,
    userId: req.user.userId,
    filters: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
