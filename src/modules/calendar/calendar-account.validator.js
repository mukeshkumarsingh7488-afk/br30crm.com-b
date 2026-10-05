const { param, body, query } = require("express-validator");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const accountIdValidator = [param("accountId").matches(objectIdRegex).withMessage("Invalid calendar account ID.")];
const businessIdValidator = [param("businessId").matches(objectIdRegex).withMessage("Invalid business ID.")];
const providerValidator = body("provider").isIn(["GOOGLE", "OUTLOOK"]).withMessage("Provider must be GOOGLE or OUTLOOK.");
const connectValidator = [...businessIdValidator, providerValidator];
const listValidator = [...businessIdValidator, query("provider").optional().isIn(["GOOGLE", "OUTLOOK"]).withMessage("Invalid provider.")];
module.exports = { businessIdValidator, accountIdValidator, connectValidator, listValidator };
