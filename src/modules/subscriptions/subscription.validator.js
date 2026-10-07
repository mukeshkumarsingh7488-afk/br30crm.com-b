const { param, body } = require("express-validator");
exports.business = [param("businessId").isMongoId()];
exports.checkout = [...exports.business, body("plan").isIn(["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"]), body("billingCycle").optional().isIn(["MONTHLY", "YEARLY"])];
exports.status = [...exports.business, param("orderId").isString().trim().notEmpty()];
