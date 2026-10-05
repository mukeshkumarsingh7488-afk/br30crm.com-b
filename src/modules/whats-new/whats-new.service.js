const mongoose = require("mongoose");

const WhatsNew = require("./whats-new.model");

const ApiError = require("../../utils/ApiError");

const ALLOWED_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const normalizeYouTubeUrl = (url) => {
  if (!url) {
    return null;
  }

  const value = String(url).trim();

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    let videoId = "";

    if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) {
      videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    }

    if ((hostname === "youtube.com" || hostname === "www.youtube.com" || hostname.endsWith(".youtube.com")) && parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v") || "";
    }

    if ((hostname === "youtube.com" || hostname === "www.youtube.com" || hostname.endsWith(".youtube.com")) && parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    }

    if ((hostname === "youtube.com" || hostname === "www.youtube.com" || hostname.endsWith(".youtube.com")) && parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    }

    videoId = videoId.split(/[?&#/]/)[0].trim();

    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      throw new Error("Invalid YouTube video ID");
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch (error) {
    throw new ApiError(422, "Please provide a valid YouTube public video URL");
  }
};

const normalizeFeatures = (features) => {
  if (features === undefined || features === null || features === "") {
    return [];
  }

  let values = features;

  if (typeof values === "string") {
    try {
      const parsed = JSON.parse(values);

      if (Array.isArray(parsed)) {
        values = parsed;
      } else {
        values = [values];
      }
    } catch {
      values = values
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 100);
};

const normalizeImageUrl = (url) => {
  if (url === undefined || url === null) {
    return null;
  }

  const value = String(url).trim();

  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid image URL protocol");
    }

    return value;
  } catch (error) {
    throw new ApiError(422, "Please provide a valid image URL");
  }
};

const sanitizeData = (data = {}) => {
  const clean = {};

  const allowedFields = ["title", "slug", "shortDescription", "description", "version", "type", "status", "mediaType", "imageUrl", "videoUrl", "videoMuted", "videoAutoplay", "videoLoop", "howToUse", "actionText", "actionUrl", "features", "releaseDate", "sortOrder"];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      clean[field] = data[field];
    }
  });

  if (clean.slug !== undefined && clean.slug !== null) {
    clean.slug = String(clean.slug).trim().toLowerCase();
  }

  if (clean.features !== undefined) {
    clean.features = normalizeFeatures(clean.features);
  }

  if (clean.imageUrl !== undefined) {
    clean.imageUrl = normalizeImageUrl(clean.imageUrl);
  }

  if (clean.mediaType === "NONE") {
    clean.imageUrl = null;
    clean.videoUrl = null;
  }

  if (clean.mediaType === "IMAGE") {
    clean.videoUrl = null;
  }

  if (clean.mediaType === "VIDEO") {
    clean.imageUrl = null;

    if (clean.videoUrl) {
      clean.videoUrl = normalizeYouTubeUrl(clean.videoUrl);
    }
  }

  if (clean.releaseDate !== undefined && clean.releaseDate !== null) {
    const parsedDate = new Date(clean.releaseDate);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new ApiError(422, "Invalid release date");
    }

    clean.releaseDate = parsedDate;
  }

  if (clean.sortOrder !== undefined) {
    clean.sortOrder = Number(clean.sortOrder) || 0;
  }

  return clean;
};

const getPublicFilter = () => ({
  status: "PUBLISHED",
});

const createWhatsNew = async ({ data, userId }) => {
  const cleanData = sanitizeData(data);

  if (!ALLOWED_STATUS.includes(cleanData.status)) {
    throw new ApiError(422, "Invalid What's New status");
  }

  const existing = await WhatsNew.findOne({
    slug: cleanData.slug,
  }).lean();

  if (existing) {
    throw new ApiError(409, "A What's New item with this slug already exists");
  }

  if (cleanData.status === "PUBLISHED" && !cleanData.releaseDate) {
    cleanData.releaseDate = new Date();
  }

  const whatsNew = await WhatsNew.create({
    ...cleanData,
    createdBy: userId || null,
    updatedBy: userId || null,
  });

  return whatsNew;
};

const getPublicWhatsNew = async ({ type, page = 1, limit = 12 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 100);

  const filter = getPublicFilter();

  if (type) {
    filter.type = type;
  }

  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WhatsNew.find(filter)
      .select("-createdBy -updatedBy")
      .sort({
        releaseDate: -1,
        sortOrder: 1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    WhatsNew.countDocuments(filter),
  ]);

  return {
    items,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getPublicWhatsNewBySlug = async (slug) => {
  const item = await WhatsNew.findOne({
    slug: String(slug).trim().toLowerCase(),
    ...getPublicFilter(),
  })
    .select("-createdBy -updatedBy")
    .lean();

  if (!item) {
    throw new ApiError(404, "What's New item not found");
  }

  return item;
};

const getWhatsNewById = async (whatsNewId) => {
  if (!isValidObjectId(whatsNewId)) {
    throw new ApiError(400, "Invalid What's New ID");
  }

  const item = await WhatsNew.findById(whatsNewId).populate("createdBy", "name email").populate("updatedBy", "name email");

  if (!item) {
    throw new ApiError(404, "What's New item not found");
  }

  return item;
};

const getAllWhatsNew = async ({ type, status, search, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1);

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (search && String(search).trim()) {
    const value = String(search).trim();

    const escapedSearch = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        shortDescription: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WhatsNew.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        sortOrder: 1,
        releaseDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    WhatsNew.countDocuments(filter),
  ]);

  return {
    items,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const updateWhatsNew = async ({ whatsNewId, data, userId }) => {
  if (!isValidObjectId(whatsNewId)) {
    throw new ApiError(400, "Invalid What's New ID");
  }

  const item = await WhatsNew.findById(whatsNewId);

  if (!item) {
    throw new ApiError(404, "What's New item not found");
  }

  const cleanData = sanitizeData(data);

  if (cleanData.slug && cleanData.slug !== item.slug) {
    const existing = await WhatsNew.findOne({
      slug: cleanData.slug,
      _id: {
        $ne: whatsNewId,
      },
    }).lean();

    if (existing) {
      throw new ApiError(409, "A What's New item with this slug already exists");
    }
  }

  const hasImageUrl = Object.prototype.hasOwnProperty.call(data, "imageUrl");

  const hasValidNewImageUrl = hasImageUrl && data.imageUrl !== undefined && data.imageUrl !== null && String(data.imageUrl).trim() !== "";

  if (cleanData.mediaType === "IMAGE") {
    cleanData.videoUrl = null;

    if (hasValidNewImageUrl) {
      cleanData.imageUrl = normalizeImageUrl(data.imageUrl);
    } else {
      cleanData.imageUrl = item.imageUrl || null;
    }
  }

  if (cleanData.mediaType === "VIDEO") {
    cleanData.imageUrl = null;

    if (cleanData.videoUrl) {
      cleanData.videoUrl = normalizeYouTubeUrl(cleanData.videoUrl);
    }
  }

  if (cleanData.mediaType === "NONE") {
    cleanData.imageUrl = null;
    cleanData.videoUrl = null;
  }

  if (cleanData.status === "PUBLISHED" && !item.releaseDate && !cleanData.releaseDate) {
    cleanData.releaseDate = new Date();
  }

  Object.assign(item, cleanData);

  item.updatedBy = userId || null;

  await item.save();

  return item;
};

const updateStatus = async ({ whatsNewId, status, userId }) => {
  if (!isValidObjectId(whatsNewId)) {
    throw new ApiError(400, "Invalid What's New ID");
  }

  if (!ALLOWED_STATUS.includes(status)) {
    throw new ApiError(422, "Invalid What's New status");
  }

  const item = await WhatsNew.findById(whatsNewId);

  if (!item) {
    throw new ApiError(404, "What's New item not found");
  }

  item.status = status;

  if (status === "PUBLISHED" && !item.releaseDate) {
    item.releaseDate = new Date();
  }

  item.updatedBy = userId || null;

  await item.save();

  return item;
};

const deleteWhatsNew = async ({ whatsNewId, userId }) => {
  if (!isValidObjectId(whatsNewId)) {
    throw new ApiError(400, "Invalid What's New ID");
  }

  const item = await WhatsNew.findById(whatsNewId);

  if (!item) {
    throw new ApiError(404, "What's New item not found");
  }

  item.status = "ARCHIVED";
  item.updatedBy = userId || null;

  await item.save();

  return item;
};

module.exports = {
  createWhatsNew,
  getPublicWhatsNew,
  getPublicWhatsNewBySlug,
  getWhatsNewById,
  getAllWhatsNew,
  updateWhatsNew,
  updateStatus,
  deleteWhatsNew,
  normalizeYouTubeUrl,
};
