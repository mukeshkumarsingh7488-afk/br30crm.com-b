const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const whatsNewService = require("./whats-new.service");

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const parseRequestData = (body = {}) => {
  const data = {
    ...body,
  };

  /*
   * ----------------------------------------------------------
   * Boolean fields
   * ----------------------------------------------------------
   */

  const booleanFields = ["videoMuted", "videoAutoplay", "videoLoop"];

  booleanFields.forEach((field) => {
    if (data[field] === "true" || data[field] === true) {
      data[field] = true;
    }

    if (data[field] === "false" || data[field] === false) {
      data[field] = false;
    }
  });

  /*
   * ----------------------------------------------------------
   * Features
   * ----------------------------------------------------------
   */

  if (data.features !== undefined && typeof data.features === "string") {
    const value = data.features.trim();

    if (!value) {
      data.features = [];
    } else {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          data.features = parsed;
        } else {
          data.features = value
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        data.features = value
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * Numeric fields
   * ----------------------------------------------------------
   */

  if (data.sortOrder !== undefined && data.sortOrder !== "") {
    const parsedSortOrder = Number(data.sortOrder);

    if (!Number.isNaN(parsedSortOrder)) {
      data.sortOrder = parsedSortOrder;
    }
  }

  /*
   * ----------------------------------------------------------
   * Empty optional values
   * ----------------------------------------------------------
   */

  const nullableFields = ["version", "releaseDate", "videoUrl", "imageUrl", "actionText", "actionUrl", "description", "howToUse"];

  nullableFields.forEach((field) => {
    if (data[field] === "") {
      data[field] = null;
    }
  });

  /*
   * ----------------------------------------------------------
   * IMAGE URL
   * ----------------------------------------------------------
   *
   * Cloudinary / any public image URL directly save hoga.
   * ----------------------------------------------------------
   */

  if (data.imageUrl !== undefined && data.imageUrl !== null) {
    data.imageUrl = String(data.imageUrl).trim();
  }

  /*
   * ----------------------------------------------------------
   * MEDIA MODE
   * ----------------------------------------------------------
   */

  if (data.mediaType === "NONE") {
    data.imageUrl = null;
    data.videoUrl = null;
  }

  if (data.mediaType === "IMAGE") {
    data.videoUrl = null;
  }

  if (data.mediaType === "VIDEO") {
    data.imageUrl = null;
  }

  return data;
};

/*
 * ============================================================
 * PUBLIC
 * ============================================================
 */

/*
 * GET /api/v1/whatsnew
 */

const getPublicWhatsNew = asyncHandler(async (req, res) => {
  const result = await whatsNewService.getPublicWhatsNew({
    type: req.query.type,
    page: req.query.page,
    limit: req.query.limit,
  });

  return ApiResponse.success(res, result, "What's New items fetched successfully");
});

/*
 * GET /api/v1/whatsnew/slug/:slug
 */

const getPublicWhatsNewBySlug = asyncHandler(async (req, res) => {
  const item = await whatsNewService.getPublicWhatsNewBySlug(req.params.slug);

  return ApiResponse.success(res, item, "What's New item fetched successfully");
});

/*
 * ============================================================
 * ADMIN
 * ============================================================
 */

/*
 * POST /api/v1/whatsnew/admin
 */

const createWhatsNew = asyncHandler(async (req, res) => {
  const data = parseRequestData(req.body);

  const item = await whatsNewService.createWhatsNew({
    data,
    userId: req.user.userId,
  });

  return ApiResponse.created(res, item, "What's New item created successfully");
});

/*
 * GET /api/v1/whatsnew/admin
 */

const getAllWhatsNew = asyncHandler(async (req, res) => {
  const result = await whatsNewService.getAllWhatsNew({
    type: req.query.type,
    status: req.query.status,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  });

  return ApiResponse.success(res, result, "What's New items fetched successfully");
});

/*
 * GET /api/v1/whatsnew/admin/:whatsNewId
 */

const getWhatsNewById = asyncHandler(async (req, res) => {
  const item = await whatsNewService.getWhatsNewById(req.params.whatsNewId);

  return ApiResponse.success(res, item, "What's New item fetched successfully");
});

/*
 * PATCH /api/v1/whatsnew/admin/:whatsNewId
 */

const updateWhatsNew = asyncHandler(async (req, res) => {
  const data = parseRequestData(req.body);

  const item = await whatsNewService.updateWhatsNew({
    whatsNewId: req.params.whatsNewId,
    data,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New item updated successfully");
});

/*
 * PATCH /api/v1/whatsnew/admin/:whatsNewId/status
 */

const updateStatus = asyncHandler(async (req, res) => {
  const item = await whatsNewService.updateStatus({
    whatsNewId: req.params.whatsNewId,
    status: req.body.status,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New status updated successfully");
});

/*
 * DELETE /api/v1/whatsnew/admin/:whatsNewId
 *
 * Backend actual delete nahi karta.
 * Item ko ARCHIVED karta hai.
 */

const deleteWhatsNew = asyncHandler(async (req, res) => {
  const item = await whatsNewService.deleteWhatsNew({
    whatsNewId: req.params.whatsNewId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New item archived successfully");
});

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  getPublicWhatsNew,
  getPublicWhatsNewBySlug,

  createWhatsNew,

  getAllWhatsNew,
  getWhatsNewById,

  updateWhatsNew,
  updateStatus,
  deleteWhatsNew,
};
