const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const announcementService = require("./announcement.service");

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement({
    data: req.body,
    userId: req.user.userId,
  });

  return ApiResponse.created(res, { announcement }, "Announcement created successfully.");
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncements({
    userId: req.user?.userId || null,
    businessId: req.query.businessId || null,
    type: req.query.type,
    releaseType: req.query.releaseType,
    status: req.query.status,
    visibility: req.query.visibility,
    featured: typeof req.query.featured !== "undefined" ? req.query.featured : undefined,
    page: req.query.page,
    limit: req.query.limit,
    publicOnly: false,
  });

  return ApiResponse.success(res, result, "Announcements fetched successfully.");
});

const getPublicAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncements({
    userId: null,
    businessId: null,
    type: req.query.type,
    releaseType: req.query.releaseType,
    page: req.query.page,
    limit: req.query.limit,
    publicOnly: true,
  });

  return ApiResponse.success(res, result, "Public announcements fetched successfully.");
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.announcementId);

  return ApiResponse.success(res, { announcement }, "Announcement fetched successfully.");
});

const getAnnouncementBySlug = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementBySlug(req.params.slug);

  return ApiResponse.success(res, { announcement }, "Announcement fetched successfully.");
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement({
    announcementId: req.params.announcementId,
    data: req.body,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, { announcement }, "Announcement updated successfully.");
});

const publishAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.publishAnnouncement({
    announcementId: req.params.announcementId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, { announcement }, "Announcement published successfully.");
});

const archiveAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.archiveAnnouncement({
    announcementId: req.params.announcementId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, { announcement }, "Announcement archived successfully.");
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.deleteAnnouncement({
    announcementId: req.params.announcementId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, { announcement }, "Announcement archived successfully.");
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getPublicAnnouncements,
  getAnnouncementById,
  getAnnouncementBySlug,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
};
