const { param } = require("express-validator");
const sessionId = [param("sessionId").isUUID().withMessage("Invalid session ID.")];
module.exports = { sessionId };
