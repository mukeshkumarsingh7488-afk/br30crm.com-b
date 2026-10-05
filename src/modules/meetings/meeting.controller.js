const asyncHandler = require("../../utils/asyncHandler");

const s = require("./meeting.service");

exports.list = asyncHandler(async (req, res) => {
  const result = await s.list({
    businessId: req.params.businessId,
    userId: req.user.userId,

    from: req.query.from,
    to: req.query.to,
    status: req.query.status,
    search: req.query.search,
    organizerId: req.query.organizerId,

    relatedType: req.query.relatedType,
    relatedId: req.query.relatedId,

    page: req.query.page,
    limit: req.query.limit,
  });

  return res.json({
    success: true,
    data: result,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const meeting = await s.getById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    meetingId: req.params.meetingId,
  });

  return res.json({
    success: true,
    data: meeting,
  });
});

exports.create = asyncHandler(async (req, res) => {
  const meeting = await s.create({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  return res.status(201).json({
    success: true,
    data: meeting,
  });
});

exports.update = asyncHandler(async (req, res) => {
  const meeting = await s.update({
    businessId: req.params.businessId,
    userId: req.user.userId,
    meetingId: req.params.meetingId,
    data: req.body,
  });

  return res.json({
    success: true,
    data: meeting,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const meeting = await s.remove({
    businessId: req.params.businessId,
    userId: req.user.userId,
    meetingId: req.params.meetingId,
  });

  return res.json({
    success: true,
    data: meeting,
  });
});
