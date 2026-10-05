const { body, param, query } = require("express-validator");

const businessId = param("businessId").isMongoId().withMessage("Invalid business ID.");

const qrId = param("qrId").isMongoId().withMessage("Invalid QR ID.");

const formId = body("formId").isMongoId().withMessage("formId must be a valid ID.");

const size = body("size").optional().isInt({ min: 128, max: 2048 }).withMessage("QR size must be between 128 and 2048.");

const margin = body("margin").optional().isInt({ min: 0, max: 20 }).withMessage("QR margin must be between 0 and 20.");

const errorCorrectionLevel = body("errorCorrectionLevel").optional().isIn(["L", "M", "Q", "H"]).withMessage("Invalid QR error correction level.");

const format = body("format").optional().isIn(["png", "svg"]).withMessage("QR format must be png or svg.");

const active = body("active").optional().isBoolean().withMessage("active must be boolean.");

exports.list = [businessId, query("formId").optional().isMongoId().withMessage("Invalid form ID."), query("active").optional().isBoolean().withMessage("active must be boolean."), query("search").optional().isString().trim().isLength({ max: 100 }).withMessage("Search is too long.")];

exports.create = [
  businessId,

  formId,

  body("name").optional().isString().trim().isLength({ min: 1, max: 150 }).withMessage("QR name must be between 1 and 150 characters."),

  size,

  margin,

  errorCorrectionLevel,

  format,

  active,

  body("metadata").optional().isObject().withMessage("metadata must be an object."),
];

exports.update = [
  businessId,

  qrId,

  body("name").optional().isString().trim().isLength({ min: 1, max: 150 }).withMessage("QR name must be between 1 and 150 characters."),

  size,

  margin,

  errorCorrectionLevel,

  format,

  active,

  body("metadata").optional().isObject().withMessage("metadata must be an object."),
];

exports.byId = [businessId, qrId];

exports.regenerate = [businessId, qrId, size, margin, errorCorrectionLevel, format];
