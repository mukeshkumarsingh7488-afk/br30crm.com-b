const { body, param, query } = require("express-validator");

const businessId = [param("businessId").isMongoId().withMessage("Invalid business ID")];

const sendValidator = [
  ...businessId,

  body("channel").trim().toUpperCase().isIn(["EMAIL", "WHATSAPP", "SMS"]).withMessage("Invalid communication channel"),

  body("to").trim().notEmpty().withMessage("Recipient is required").isLength({ max: 2000 }).withMessage("Recipient is too long"),

  body("body").trim().notEmpty().withMessage("Message body is required").isLength({ max: 20000 }).withMessage("Message body is too long"),

  body("subject").optional({ values: "null" }).trim().isLength({ max: 300 }).withMessage("Subject is too long"),

  body("html").optional({ values: "null" }).isLength({ max: 30000 }).withMessage("HTML content is too long"),

  body("relatedTo").optional({ values: "null" }).isObject().withMessage("relatedTo must be an object"),

  body("relatedTo.type").optional({ values: "null" }).isIn(["LEAD", "CONTACT", "COMPANY", "DEAL"]).withMessage("Invalid relatedTo type"),

  body("relatedTo.id").optional({ values: "null" }).isMongoId().withMessage("Invalid relatedTo ID"),
];

const listValidator = [
  ...businessId,

  query("page").optional().isInt({ min: 1 }).withMessage("Invalid page").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Invalid limit").toInt(),

  query("channel").optional().trim().toUpperCase().isIn(["EMAIL", "WHATSAPP", "SMS"]).withMessage("Invalid communication channel"),

  query("search").optional().trim().isLength({ max: 200 }).withMessage("Search text is too long"),
];

module.exports = {
  businessId,
  sendValidator,
  listValidator,
};
