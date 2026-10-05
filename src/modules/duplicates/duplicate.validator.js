const { param, query, body } = require("express-validator");
const entityTypes = ["CONTACT", "COMPANY", "LEAD"];
const base = [param("businessId").isMongoId().withMessage("Invalid business ID.")];
const detectValidator = [...base, body("entityType").isIn(entityTypes).withMessage("Invalid entity type.")];
const listValidator = [...base, query("status").optional().isIn(["OPEN", "IGNORED", "MERGED"]), query("entityType").optional().isIn(entityTypes), query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })];
const resolveValidator = [...base, param("duplicateId").isMongoId(), body("action").isIn(["merge", "ignore"])];
module.exports = { detectValidator, listValidator, resolveValidator };
