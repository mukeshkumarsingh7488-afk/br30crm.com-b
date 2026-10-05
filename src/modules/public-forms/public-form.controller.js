const asyncHandler = require("../../utils/asyncHandler");
const service = require("./public-form.service");

exports.create = asyncHandler(async (req, res) => {
  const data = await service.createForm({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Public form created",
    data,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const data = await service.listForms({
    businessId: req.params.businessId,
    userId: req.user.userId,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await service.deleteForm({
    businessId: req.params.businessId,
    userId: req.user.userId,
    formId: req.params.formId,
  });

  res.json({
    success: true,
    message: "Public form deleted",
    data,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await service.updateForm({
    businessId: req.params.businessId,
    userId: req.user.userId,
    formId: req.params.formId,
    data: req.body,
  });

  res.json({
    success: true,
    message: "Public form updated",
    data,
  });
});

exports.publicGet = asyncHandler(async (req, res) => {
  const data = await service.getPublicForm({
    businessId: req.params.businessId,
    slug: req.params.slug,
    tracking: {
      query: req.query,
      referrer: req.get("referer") || req.get("referrer") || null,
      origin: req.get("origin") || null,
      userAgent: req.get("user-agent") || null,
      ip: req.ip || null,
    },
  });

  res.json({
    success: true,
    data,
  });
});

exports.submit = asyncHandler(async (req, res) => {
  const data = await service.submitForm({
    businessId: req.params.businessId,
    slug: req.params.slug,
    data: req.body,
    metadata: {
      ip: req.ip || null,
      userAgent: req.get("user-agent") || null,
      referrer: req.get("referer") || req.get("referrer") || null,
      origin: req.get("origin") || null,
      host: req.get("host") || null,
      query: req.query || {},
      utm: {
        source: req.query?.utm_source || null,
        medium: req.query?.utm_medium || null,
        campaign: req.query?.utm_campaign || null,
        term: req.query?.utm_term || null,
        content: req.query?.utm_content || null,
      },
    },
  });

  res.status(201).json({
    success: true,
    data,
  });
});

exports.qr = asyncHandler(async (req, res) => {
  const data = await service.getQrData({
    businessId: req.params.businessId,
    slug: req.params.slug,
  });

  res.json({
    success: true,
    data,
  });
});
