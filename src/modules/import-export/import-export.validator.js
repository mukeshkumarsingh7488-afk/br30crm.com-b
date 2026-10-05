const { param, query, body } = require("express-validator");
const types = ["LEAD", "CONTACT", "COMPANY", "DEAL"];
const base = [param("businessId").isMongoId()];
const job = [...base, param("jobId").isMongoId()];
const createImport = [
  ...base,
  body("entityType").isIn(types),
  body()
    .custom((v) => Array.isArray(v.rows) || typeof v.csv === "string")
    .withMessage("Provide rows or csv."),
];
const list = [...base, query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })];
const exportValidator = [...base, body("entityType").isIn(types)];
module.exports = { createImport, list, job, exportValidator };
