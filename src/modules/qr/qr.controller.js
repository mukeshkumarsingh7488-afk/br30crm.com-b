const asyncHandler = require("../../utils/asyncHandler");

const service = require("./qr.service");

exports.list = asyncHandler(async (req, res) => {
  const data = await service.list({
    businessId: req.params.businessId,
    userId: req.user.userId,
    formId: req.query.formId,
    active: req.query.active,
    search: req.query.search,
  });

  res.json({
    success: true,
    data,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await service.getById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
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
    message: "QR code created successfully.",
    data,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.update({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
    data: req.body,
  });

  res.json({
    success: true,
    message: "QR code updated successfully.",
    data,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await service.remove({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
  });

  res.json({
    success: true,
    message: "QR code deleted successfully.",
    data,
  });
});

exports.regenerate = asyncHandler(async (req, res) => {
  const data = await service.regenerate({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
    data: req.body,
  });

  res.json({
    success: true,
    message: "QR code regenerated successfully.",
    data,
  });
});

exports.image = asyncHandler(async (req, res) => {
  const data = await service.getImage({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
  });

  const qr = await service.getById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    qrId: req.params.qrId,
  });

  if (qr.format === "svg") {
    res.type("image/svg+xml").send(data);
    return;
  }

  const base64 = String(data).split(",")[1];

  res.type("image/png").send(Buffer.from(base64, "base64"));
});
