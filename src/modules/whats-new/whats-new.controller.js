const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const whatsNewService = require("./whats-new.service");

const parseRequestData = (body = {}) => {
  const data = {
    ...body,
  };

  const booleanFields = ["videoMuted", "videoAutoplay", "videoLoop"];

  booleanFields.forEach((field) => {
    if (data[field] === "true" || data[field] === true) {
      data[field] = true;
    }

    if (data[field] === "false" || data[field] === false) {
      data[field] = false;
    }
  });

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

  if (data.sortOrder !== undefined && data.sortOrder !== "") {
    const parsedSortOrder = Number(data.sortOrder);

    if (!Number.isNaN(parsedSortOrder)) {
      data.sortOrder = parsedSortOrder;
    }
  }

  const nullableFields = ["version", "releaseDate", "videoUrl", "imageUrl", "actionText", "actionUrl", "description", "howToUse"];

  nullableFields.forEach((field) => {
    if (data[field] === "") {
      data[field] = null;
    }
  });

  if (data.imageUrl !== undefined && data.imageUrl !== null) {
    data.imageUrl = String(data.imageUrl).trim();
  }

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

const getPublicWhatsNew = asyncHandler(async (req, res) => {
  const result = await whatsNewService.getPublicWhatsNew({
    type: req.query.type,
    page: req.query.page,
    limit: req.query.limit,
  });

  return ApiResponse.success(res, result, "What's New items fetched successfully");
});

const getPublicWhatsNewBySlug = asyncHandler(async (req, res) => {
  const item = await whatsNewService.getPublicWhatsNewBySlug(req.params.slug);

  return ApiResponse.success(res, item, "What's New item fetched successfully");
});

const createWhatsNew = asyncHandler(async (req, res) => {
  const data = parseRequestData(req.body);

  const item = await whatsNewService.createWhatsNew({
    data,
    userId: req.user.userId,
  });

  return ApiResponse.created(res, item, "What's New item created successfully");
});

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

const getWhatsNewById = asyncHandler(async (req, res) => {
  const item = await whatsNewService.getWhatsNewById(req.params.whatsNewId);

  return ApiResponse.success(res, item, "What's New item fetched successfully");
});

const updateWhatsNew = asyncHandler(async (req, res) => {
  const data = parseRequestData(req.body);

  const item = await whatsNewService.updateWhatsNew({
    whatsNewId: req.params.whatsNewId,
    data,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New item updated successfully");
});

const updateStatus = asyncHandler(async (req, res) => {
  const item = await whatsNewService.updateStatus({
    whatsNewId: req.params.whatsNewId,
    status: req.body.status,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New status updated successfully");
});

const deleteWhatsNew = asyncHandler(async (req, res) => {
  const item = await whatsNewService.deleteWhatsNew({
    whatsNewId: req.params.whatsNewId,
    userId: req.user.userId,
  });

  return ApiResponse.success(res, item, "What's New item archived successfully");
});

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
