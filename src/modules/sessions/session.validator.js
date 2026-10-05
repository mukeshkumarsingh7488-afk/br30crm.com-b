const { param } = require("express-validator");
const sessionId = [param("sessionId").isMongoId().withMessage("Invalid session ID.")];
module.exports = { sessionId };
