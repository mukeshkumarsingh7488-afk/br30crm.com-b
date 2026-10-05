const { body, param, query } = require("express-validator");

const validateObjectId = (field) => param(field).trim().notEmpty().withMessage(`${field} is required`).isMongoId().withMessage(`${field} must be a valid ID`);

const businessIdValidator = [validateObjectId("businessId")];

const announcementIdValidator = [validateObjectId("announcementId")];

const slugParamValidator = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Announcement slug is required")
    .isLength({ min: 2, max: 220 })
    .withMessage("Announcement slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid announcement slug"),
];

const internalCtaUrlValidator = body("ctaUrl")
  .optional({ nullable: true })
  .trim()
  .custom((value) => {
    if (!value) {
      return true;
    }

    if (!value.startsWith("/")) {
      throw new Error("CTA URL must be an internal path starting with /");
    }

    if (value.startsWith("//")) {
      throw new Error("CTA URL must be a valid internal path");
    }

    if (/^https?:\/\//i.test(value)) {
      throw new Error("Full URLs are not allowed. Use an internal path like /login");
    }

    return true;
  });

const createAnnouncementValidator = [
  body("title").trim().notEmpty().withMessage("Announcement title is required").isLength({ min: 2, max: 200 }).withMessage("Announcement title must be between 2 and 200 characters"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Announcement slug is required")
    .isLength({ min: 2, max: 220 })
    .withMessage("Announcement slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid announcement slug"),

  body("shortDescription").trim().notEmpty().withMessage("Short description is required").isLength({ max: 500 }).withMessage("Short description cannot exceed 500 characters"),

  body("description").trim().notEmpty().withMessage("Announcement description is required").isLength({ max: 10000 }).withMessage("Announcement description cannot exceed 10000 characters"),

  body("type").optional().isIn(["NEW_FEATURE", "IMPROVEMENT", "UPDATE", "FIX", "SECURITY", "MAINTENANCE", "RELEASE"]).withMessage("Invalid announcement type"),

  body("releaseType").optional().isIn(["CURRENT", "UPCOMING"]).withMessage("Invalid release type"),

  body("visibility").optional().isIn(["PUBLIC", "AUTHENTICATED", "BUSINESS"]).withMessage("Invalid visibility"),

  body("scope").optional().isIn(["SYSTEM", "BUSINESS"]).withMessage("Invalid announcement scope"),

  body("businessId").optional({ nullable: true }).isMongoId().withMessage("businessId must be a valid ID"),

  body("version").optional({ nullable: true }).isString().isLength({ max: 50 }).withMessage("Version cannot exceed 50 characters"),

  body("tags").optional().isArray().withMessage("tags must be an array"),

  body("tags.*").optional().isString().trim().isLength({ max: 50 }).withMessage("Each tag cannot exceed 50 characters"),

  body("imageUrl").optional({ nullable: true }).isURL().withMessage("imageUrl must be a valid URL"),

  body("videoUrl").optional({ nullable: true }).isURL().withMessage("videoUrl must be a valid URL"),

  body("videoThumbnailUrl").optional({ nullable: true }).isURL().withMessage("videoThumbnailUrl must be a valid URL"),

  body("mediaType").optional().isIn(["NONE", "IMAGE", "VIDEO"]).withMessage("Invalid media type"),

  body("ctaText").optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage("CTA text cannot exceed 100 characters"),

  internalCtaUrlValidator,

  body("targetAudience").optional().isIn(["ALL", "ADMIN", "MANAGER", "SALES", "STAFF"]).withMessage("Invalid target audience"),

  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean").toBoolean(),

  body("displayOrder").optional().isInt().withMessage("displayOrder must be an integer").toInt(),

  body("releaseDate").optional({ nullable: true }).isISO8601().withMessage("releaseDate must be a valid date"),
];

const updateAnnouncementValidator = [
  ...announcementIdValidator,

  body("title").optional().trim().notEmpty().withMessage("Announcement title cannot be empty").isLength({ min: 2, max: 200 }).withMessage("Announcement title must be between 2 and 200 characters"),

  body("slug")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 220 })
    .withMessage("Announcement slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid announcement slug"),

  body("shortDescription").optional().trim().notEmpty().isLength({ max: 500 }).withMessage("Short description cannot exceed 500 characters"),

  body("description").optional().trim().notEmpty().isLength({ max: 10000 }).withMessage("Description cannot exceed 10000 characters"),

  body("type").optional().isIn(["NEW_FEATURE", "IMPROVEMENT", "UPDATE", "FIX", "SECURITY", "MAINTENANCE", "RELEASE"]).withMessage("Invalid announcement type"),

  body("releaseType").optional().isIn(["CURRENT", "UPCOMING"]).withMessage("Invalid release type"),

  body("status").optional().isIn(["DRAFT", "PUBLISHED", "ARCHIVED"]).withMessage("Invalid announcement status"),

  body("visibility").optional().isIn(["PUBLIC", "AUTHENTICATED", "BUSINESS"]).withMessage("Invalid visibility"),

  body("scope").optional().isIn(["SYSTEM", "BUSINESS"]).withMessage("Invalid announcement scope"),

  body("businessId").optional({ nullable: true }).isMongoId().withMessage("businessId must be a valid ID"),

  body("version").optional({ nullable: true }).isString().isLength({ max: 50 }).withMessage("Version cannot exceed 50 characters"),

  body("tags").optional().isArray().withMessage("tags must be an array"),

  body("tags.*").optional().isString().trim().isLength({ max: 50 }).withMessage("Each tag cannot exceed 50 characters"),

  body("imageUrl").optional({ nullable: true }).isURL().withMessage("imageUrl must be a valid URL"),

  body("videoUrl").optional({ nullable: true }).isURL().withMessage("videoUrl must be a valid URL"),

  body("videoThumbnailUrl").optional({ nullable: true }).isURL().withMessage("videoThumbnailUrl must be a valid URL"),

  body("mediaType").optional().isIn(["NONE", "IMAGE", "VIDEO"]).withMessage("Invalid media type"),

  body("ctaText").optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage("CTA text cannot exceed 100 characters"),

  internalCtaUrlValidator,

  body("targetAudience").optional().isIn(["ALL", "ADMIN", "MANAGER", "SALES", "STAFF"]).withMessage("Invalid target audience"),

  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean").toBoolean(),

  body("displayOrder").optional().isInt().withMessage("displayOrder must be an integer").toInt(),

  body("releaseDate").optional({ nullable: true }).isISO8601().withMessage("releaseDate must be a valid date"),
];

const listAnnouncementValidator = [
  query("type").optional().isIn(["NEW_FEATURE", "IMPROVEMENT", "UPDATE", "FIX", "SECURITY", "MAINTENANCE", "RELEASE"]).withMessage("Invalid announcement type"),

  query("releaseType").optional().isIn(["CURRENT", "UPCOMING"]).withMessage("Invalid release type"),

  query("status").optional().isIn(["DRAFT", "PUBLISHED", "ARCHIVED"]).withMessage("Invalid announcement status"),

  query("visibility").optional().isIn(["PUBLIC", "AUTHENTICATED", "BUSINESS"]).withMessage("Invalid visibility"),

  query("featured").optional().isBoolean().withMessage("featured must be a boolean").toBoolean(),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
];

module.exports = {
  businessIdValidator,
  announcementIdValidator,
  slugParamValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
  listAnnouncementValidator,
};
