const mongoose = require("mongoose");

const Announcement = require("./announcement.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");

const ApiError = require("../../utils/ApiError");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateBusiness = async (businessId) => {
  if (!isValidObjectId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }

  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  if (business.status && business.status !== "ACTIVE") {
    throw new ApiError(400, "Business is not active");
  }

  return business;
};

const validateBusinessMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).select("_id userId");

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return member;
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
};

const validateScope = async ({ scope, businessId }) => {
  if (scope === "BUSINESS" && !businessId) {
    throw new ApiError(400, "businessId is required for BUSINESS scoped announcements");
  }

  if (scope === "SYSTEM" && businessId) {
    throw new ApiError(400, "businessId must be null for SYSTEM scoped announcements");
  }

  if (businessId) {
    await validateBusiness(businessId);
  }
};

const getAnnouncementById = async (announcementId) => {
  if (!isValidObjectId(announcementId)) {
    throw new ApiError(400, "Invalid announcement ID");
  }

  const announcement = await Announcement.findById(announcementId).populate("createdBy", "name email").populate("updatedBy", "name email");

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
};

const getAnnouncementBySlug = async (slug) => {
  const announcement = await Announcement.findOne({
    slug: slug.trim().toLowerCase(),
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
};

/*
 * ============================================================
 * CREATE ANNOUNCEMENT
 * ============================================================
 */

const createAnnouncement = async ({ data, userId }) => {
  const scope = data.scope || "SYSTEM";
  const businessId = data.businessId || null;

  await validateScope({
    scope,
    businessId,
  });

  if (businessId) {
    await validateBusinessMember(businessId, userId);
  }

  const existing = await Announcement.findOne({
    slug: data.slug.trim().toLowerCase(),
    scope,
    businessId,
  }).select("_id");

  if (existing) {
    throw new ApiError(409, "An announcement with this slug already exists");
  }

  const announcementData = {
    ...data,

    slug: data.slug.trim().toLowerCase(),

    scope,

    businessId,

    tags: normalizeTags(data.tags),

    createdBy: userId,
  };

  /*
   * ------------------------------------------------------------
   * Published / Archived date handling
   * ------------------------------------------------------------
   */

  if (announcementData.status === "PUBLISHED") {
    announcementData.publishedAt = new Date();
    announcementData.archivedAt = null;
  } else if (announcementData.status === "ARCHIVED") {
    announcementData.archivedAt = new Date();
    announcementData.publishedAt = null;
  } else {
    announcementData.publishedAt = null;
    announcementData.archivedAt = null;
  }

  const announcement = await Announcement.create(announcementData);

  return announcement;
};

/*
 * ============================================================
 * GET ANNOUNCEMENTS
 * ============================================================
 */

const getAnnouncements = async ({ userId, businessId, type, releaseType, status, visibility, featured, page = 1, limit = 20, publicOnly = false }) => {
  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {};

  /*
   * ------------------------------------------------------------
   * PUBLIC ANNOUNCEMENTS
   * ------------------------------------------------------------
   */

  if (publicOnly) {
    filter.status = "PUBLISHED";

    filter.visibility = "PUBLIC";

    filter.scope = "SYSTEM";
  } else {
    /*
     * ----------------------------------------------------------
     * Optional filters
     * ----------------------------------------------------------
     */

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (releaseType) {
      filter.releaseType = releaseType;
    }

    if (visibility) {
      filter.visibility = visibility;
    }

    if (typeof featured !== "undefined") {
      filter.isFeatured = featured;
    }

    /*
     * ----------------------------------------------------------
     * Business scoped announcements
     * ----------------------------------------------------------
     */

    if (businessId) {
      await validateBusiness(businessId);

      if (userId) {
        await validateBusinessMember(businessId, userId);
      }

      filter.$or = [
        {
          scope: "SYSTEM",

          visibility: {
            $in: ["PUBLIC", "AUTHENTICATED"],
          },
        },

        {
          scope: "BUSINESS",

          businessId,
        },
      ];
    } else {
      /*
       * --------------------------------------------------------
       * System announcements
       * --------------------------------------------------------
       */

      filter.scope = "SYSTEM";

      if (userId) {
        filter.visibility = {
          $in: ["PUBLIC", "AUTHENTICATED"],
        };
      } else {
        filter.visibility = "PUBLIC";
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * Release date filtering
   * ------------------------------------------------------------
   */

  if (publicOnly) {
    filter.releaseDate = {
      $lte: new Date(),
    };
  } else if (releaseType === "CURRENT") {
    filter.$and = [
      ...(filter.$and || []),

      {
        $or: [
          {
            releaseDate: null,
          },

          {
            releaseDate: {
              $lte: new Date(),
            },
          },
        ],
      },
    ];
  }

  /*
   * ------------------------------------------------------------
   * Pagination
   * ------------------------------------------------------------
   */

  const skip = (pageNumber - 1) * limitNumber;

  /*
   * ------------------------------------------------------------
   * Fetch announcements + total count
   * ------------------------------------------------------------
   */

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .sort({
        isFeatured: -1,

        displayOrder: 1,

        publishedAt: -1,

        releaseDate: -1,

        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean(),

    Announcement.countDocuments(filter),
  ]);

  return {
    announcements,

    pagination: {
      page: pageNumber,

      limit: limitNumber,

      total,

      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

/*
 * ============================================================
 * UPDATE ANNOUNCEMENT
 * ============================================================
 */

const updateAnnouncement = async ({ announcementId, data, userId }) => {
  const announcement = await getAnnouncementById(announcementId);

  const nextScope = data.scope !== undefined ? data.scope : announcement.scope;

  const nextBusinessId = data.businessId !== undefined ? data.businessId : announcement.businessId;

  await validateScope({
    scope: nextScope,
    businessId: nextBusinessId,
  });

  if (nextBusinessId) {
    await validateBusinessMember(nextBusinessId, userId);
  }

  /*
   * ------------------------------------------------------------
   * Duplicate slug check
   * ------------------------------------------------------------
   */

  if (data.slug) {
    const duplicate = await Announcement.findOne({
      _id: {
        $ne: announcementId,
      },

      slug: data.slug.trim().toLowerCase(),

      scope: nextScope,

      businessId: nextBusinessId || null,
    }).select("_id");

    if (duplicate) {
      throw new ApiError(409, "An announcement with this slug already exists");
    }
  }

  const updateData = {
    ...data,

    updatedBy: userId,
  };

  /*
   * Normalize slug
   */

  if (data.slug) {
    updateData.slug = data.slug.trim().toLowerCase();
  }

  /*
   * Normalize tags
   */

  if (data.tags) {
    updateData.tags = normalizeTags(data.tags);
  }

  /*
   * ------------------------------------------------------------
   * Published / archived date handling
   * ------------------------------------------------------------
   */

  if (data.status === "PUBLISHED" && announcement.status !== "PUBLISHED") {
    updateData.publishedAt = announcement.publishedAt || new Date();

    updateData.archivedAt = null;
  }

  if (data.status === "ARCHIVED") {
    updateData.archivedAt = announcement.archivedAt || new Date();
  }

  if (data.status && data.status !== "ARCHIVED") {
    updateData.archivedAt = null;
  }

  /*
   * If announcement is moved away from published,
   * keep the existing published date unless explicitly
   * changed by the application.
   */

  const updated = await Announcement.findByIdAndUpdate(announcementId, updateData, {
    returnDocument: "after",

    runValidators: true,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  return updated;
};

/*
 * ============================================================
 * PUBLISH ANNOUNCEMENT
 * ============================================================
 */

const publishAnnouncement = async ({ announcementId, userId }) => {
  const announcement = await getAnnouncementById(announcementId);

  if (announcement.status === "ARCHIVED") {
    throw new ApiError(400, "Archived announcements cannot be published directly");
  }

  announcement.status = "PUBLISHED";

  announcement.publishedAt = announcement.publishedAt || new Date();

  announcement.archivedAt = null;

  announcement.updatedBy = userId;

  await announcement.save();

  return announcement;
};

/*
 * ============================================================
 * ARCHIVE ANNOUNCEMENT
 * ============================================================
 */

const archiveAnnouncement = async ({ announcementId, userId }) => {
  const announcement = await getAnnouncementById(announcementId);

  announcement.status = "ARCHIVED";

  announcement.archivedAt = announcement.archivedAt || new Date();

  announcement.updatedBy = userId;

  await announcement.save();

  return announcement;
};

/*
 * ============================================================
 * DELETE / ARCHIVE ANNOUNCEMENT
 * ============================================================
 */

const deleteAnnouncement = async ({ announcementId, userId }) => {
  const announcement = await getAnnouncementById(announcementId);

  announcement.status = "ARCHIVED";

  announcement.archivedAt = announcement.archivedAt || new Date();

  announcement.updatedBy = userId;

  await announcement.save();

  return announcement;
};

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  getAnnouncementBySlug,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
};
