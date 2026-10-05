const asyncHandler = require("../../utils/asyncHandler");
const service = require("./lead-source.service");

exports.list = asyncHandler(async (req, res) => {
  const data = await service.list({
    businessId: req.params.businessId,
    userId: req.user.userId,
    ...req.query,
  });

  res.json({
    success: true,
    data,
  });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.create({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Source or campaign created successfully.",
    data,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.update({
    businessId: req.params.businessId,
    userId: req.user.userId,
    sourceId: req.params.sourceId,
    data: req.body,
  });

  res.json({
    success: true,
    message: "Source or campaign updated successfully.",
    data,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await service.remove({
    businessId: req.params.businessId,
    userId: req.user.userId,
    sourceId: req.params.sourceId,
  });

  res.json({
    success: true,
    message: "Source or campaign deleted successfully.",
    data,
  });
});

exports.toggle = asyncHandler(async (req, res) => {
  const data = await service.toggle({
    businessId: req.params.businessId,
    userId: req.user.userId,
    sourceId: req.params.sourceId,
  });

  res.json({
    success: true,
    message: data.active ? "Source or campaign activated successfully." : "Source or campaign deactivated successfully.",
    data,
  });
});

exports.link = asyncHandler(async (req, res) => {
  const data = await service.getTrackingLink({
    businessId: req.params.businessId,
    userId: req.user.userId,
    sourceId: req.params.sourceId,
    formId: req.query.formId,
    formSlug: req.query.formSlug,
    baseUrl: req.query.baseUrl,
  });

  res.json({
    success: true,
    data,
  });
});
