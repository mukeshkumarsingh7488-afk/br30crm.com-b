const { body, param, query } = require("express-validator");

const ALLOWED_TYPES = ["NEW_FEATURE", "IMPROVEMENT", "FIX", "UPCOMING"];

const ALLOWED_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const ALLOWED_MEDIA_TYPES = ["NONE", "IMAGE", "VIDEO"];

/*
 * ============================================================
 * COMMON
 * ============================================================
 */

const objectIdValidator = [param("whatsNewId").trim().notEmpty().withMessage("What's New ID is required").isMongoId().withMessage("Invalid What's New ID")];

const slugValidator = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .isLength({
      min: 2,
      max: 220,
    })
    .withMessage("Slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid slug"),
];

/*
 * ============================================================
 * IMAGE URL VALIDATION
 * ============================================================
 *
 * Admin Cloudinary/public image URL paste karega.
 * File upload / Multer ki zarurat nahi hai.
 */

const imageUrlValidator = (field) =>
  body(field)
    .optional({
      values: "null",
    })
    .isString()
    .withMessage(`${field} must be a string`)
    .isLength({
      max: 2000,
    })
    .withMessage(`${field} cannot exceed 2000 characters`)
    .custom((value) => {
      if (value === null || value === undefined) {
        return true;
      }

      const url = String(value).trim();

      if (!url) {
        return true;
      }

      try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Invalid protocol");
        }

        return true;
      } catch {
        throw new Error(`${field} must be a valid image URL`);
      }
    });

/*
 * ============================================================
 * CREATE
 * ============================================================
 */

const createWhatsNewValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 2,
      max: 200,
    })
    .withMessage("Title must be between 2 and 200 characters"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .isLength({
      min: 2,
      max: 220,
    })
    .withMessage("Slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid slug"),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({
      max: 500,
    })
    .withMessage("Short description cannot exceed 500 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters"),

  body("version")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Version cannot exceed 50 characters"),

  body("type").optional().isIn(ALLOWED_TYPES).withMessage("Invalid What's New type"),

  body("status").optional().isIn(ALLOWED_STATUS).withMessage("Invalid What's New status"),

  body("mediaType").optional().isIn(ALLOWED_MEDIA_TYPES).withMessage("Invalid media type"),

  /*
   * IMAGE
   */

  imageUrlValidator("imageUrl"),

  /*
   * VIDEO
   */

  body("videoUrl")
    .optional({
      values: "null",
    })
    .isString()
    .withMessage("videoUrl must be a string")
    .isLength({
      max: 2000,
    })
    .withMessage("videoUrl cannot exceed 2000 characters"),

  body("videoMuted").optional().isBoolean().withMessage("videoMuted must be a boolean").toBoolean(),

  body("videoAutoplay").optional().isBoolean().withMessage("videoAutoplay must be a boolean").toBoolean(),

  body("videoLoop").optional().isBoolean().withMessage("videoLoop must be a boolean").toBoolean(),

  /*
   * OTHER
   */

  body("howToUse")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("How to use cannot exceed 5000 characters"),

  body("actionText")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Action text cannot exceed 100 characters"),

  body("actionUrl")
    .optional({
      values: "null",
    })
    .isString()
    .withMessage("actionUrl must be a string")
    .isLength({
      max: 1000,
    })
    .withMessage("actionUrl cannot exceed 1000 characters"),

  body("features")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return true;
      }

      if (typeof value === "string") {
        return true;
      }

      throw new Error("features must be an array");
    }),

  body("releaseDate")
    .optional({
      values: "null",
    })
    .isISO8601()
    .withMessage("releaseDate must be a valid date"),

  body("sortOrder").optional().isInt().withMessage("sortOrder must be an integer"),
];

/*
 * ============================================================
 * UPDATE
 * ============================================================
 */

const updateWhatsNewValidator = [
  ...objectIdValidator,

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({
      min: 2,
      max: 200,
    })
    .withMessage("Title must be between 2 and 200 characters"),

  body("slug")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Slug cannot be empty")
    .isLength({
      min: 2,
      max: 220,
    })
    .withMessage("Slug must be between 2 and 220 characters")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid slug"),

  body("shortDescription")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Short description cannot be empty")
    .isLength({
      max: 500,
    })
    .withMessage("Short description cannot exceed 500 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("Description cannot exceed 5000 characters"),

  body("version")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage("Version cannot exceed 50 characters"),

  body("type").optional().isIn(ALLOWED_TYPES).withMessage("Invalid What's New type"),

  body("status").optional().isIn(ALLOWED_STATUS).withMessage("Invalid What's New status"),

  body("mediaType").optional().isIn(ALLOWED_MEDIA_TYPES).withMessage("Invalid media type"),

  /*
   * IMAGE
   *
   * Optional rakha gaya hai taaki edit ke time
   * imageUrl na bhejne par old image preserve ho.
   */

  imageUrlValidator("imageUrl"),

  /*
   * VIDEO
   */

  body("videoUrl")
    .optional({
      values: "null",
    })
    .isString()
    .withMessage("videoUrl must be a string")
    .isLength({
      max: 2000,
    })
    .withMessage("videoUrl cannot exceed 2000 characters"),

  body("videoMuted").optional().isBoolean().withMessage("videoMuted must be a boolean").toBoolean(),

  body("videoAutoplay").optional().isBoolean().withMessage("videoAutoplay must be a boolean").toBoolean(),

  body("videoLoop").optional().isBoolean().withMessage("videoLoop must be a boolean").toBoolean(),

  /*
   * OTHER
   */

  body("howToUse")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 5000,
    })
    .withMessage("How to use cannot exceed 5000 characters"),

  body("actionText")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Action text cannot exceed 100 characters"),

  body("actionUrl")
    .optional({
      values: "null",
    })
    .isString()
    .withMessage("actionUrl must be a string")
    .isLength({
      max: 1000,
    })
    .withMessage("actionUrl cannot exceed 1000 characters"),

  body("features")
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return true;
      }

      if (typeof value === "string") {
        return true;
      }

      throw new Error("features must be an array");
    }),

  body("releaseDate")
    .optional({
      values: "null",
    })
    .isISO8601()
    .withMessage("releaseDate must be a valid date"),

  body("sortOrder").optional().isInt().withMessage("sortOrder must be an integer"),
];

/*
 * ============================================================
 * LIST
 * ============================================================
 */

const listWhatsNewValidator = [
  query("type").optional().isIn(ALLOWED_TYPES).withMessage("Invalid What's New type"),

  query("status").optional().isIn(ALLOWED_STATUS).withMessage("Invalid What's New status"),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 200,
    })
    .withMessage("Search cannot exceed 200 characters"),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be at least 1"),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100"),
];

/*
 * ============================================================
 * STATUS
 * ============================================================
 */

const statusValidator = [...objectIdValidator, body("status").notEmpty().withMessage("Status is required").isIn(ALLOWED_STATUS).withMessage("Invalid What's New status")];

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  objectIdValidator,
  slugValidator,
  createWhatsNewValidator,
  updateWhatsNewValidator,
  listWhatsNewValidator,
  statusValidator,
};
