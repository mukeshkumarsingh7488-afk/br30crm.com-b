const { body, param, query } = require("express-validator");

const validateObjectId = (field) => param(field).isMongoId().withMessage(`${field} must be a valid ID`);

const fileIdValidator = [validateObjectId("businessId"), validateObjectId("fileId")];

const createFileValidator = [
  validateObjectId("businessId"),

  body("originalName").trim().notEmpty().withMessage("Original file name is required").isLength({ max: 255 }).withMessage("Original file name cannot exceed 255 characters"),

  body("fileName").trim().notEmpty().withMessage("File name is required").isLength({ max: 255 }).withMessage("File name cannot exceed 255 characters"),

  body("mimeType").trim().notEmpty().withMessage("MIME type is required").isLength({ max: 150 }).withMessage("MIME type cannot exceed 150 characters"),

  body("extension").optional().isString().withMessage("Extension must be a string").isLength({ max: 20 }).withMessage("Extension cannot exceed 20 characters"),

  body("size").notEmpty().withMessage("File size is required").isFloat({ min: 0 }).withMessage("File size must be a valid positive number"),

  body("storageProvider").optional().isIn(["LOCAL", "CLOUDINARY", "S3", "OTHER"]).withMessage("Invalid storage provider"),

  body("storageKey").trim().notEmpty().withMessage("Storage key is required").isLength({ max: 1000 }).withMessage("Storage key cannot exceed 1000 characters"),

  body("url").trim().notEmpty().withMessage("File URL is required").isLength({ max: 2000 }).withMessage("File URL cannot exceed 2000 characters"),

  body("folder").optional().isString().withMessage("Folder must be a string").isLength({ max: 500 }).withMessage("Folder cannot exceed 500 characters"),

  body("visibility").optional().isIn(["PRIVATE", "BUSINESS"]).withMessage("Invalid file visibility"),

  body("entityType").optional({ nullable: true }).isString().withMessage("entityType must be a string").isLength({ max: 100 }).withMessage("entityType cannot exceed 100 characters"),

  body("entityId").optional({ nullable: true }).isMongoId().withMessage("entityId must be a valid ID"),

  body("description").optional().isString().withMessage("Description must be a string").isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
];

const listFileValidator = [
  validateObjectId("businessId"),

  query("folder").optional().isString().withMessage("Folder must be a string"),

  query("entityType").optional().isString().withMessage("entityType must be a string"),

  query("entityId").optional().isMongoId().withMessage("entityId must be a valid ID"),

  query("uploadedBy").optional().isMongoId().withMessage("uploadedBy must be a valid ID"),

  query("mimeType").optional().isString().withMessage("mimeType must be a string"),

  query("visibility").optional().isIn(["PRIVATE", "BUSINESS"]).withMessage("Invalid file visibility"),

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const updateFileValidator = [
  ...fileIdValidator,

  body("folder").optional().isString().withMessage("Folder must be a string").isLength({ max: 500 }).withMessage("Folder cannot exceed 500 characters"),

  body("visibility").optional().isIn(["PRIVATE", "BUSINESS"]).withMessage("Invalid file visibility"),

  body("description").optional().isString().withMessage("Description must be a string").isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("entityType").optional({ nullable: true }).isString().withMessage("entityType must be a string").isLength({ max: 100 }).withMessage("entityType cannot exceed 100 characters"),

  body("entityId").optional({ nullable: true }).isMongoId().withMessage("entityId must be a valid ID"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
];

module.exports = {
  createFileValidator,
  listFileValidator,
  fileIdValidator,
  updateFileValidator,
};
