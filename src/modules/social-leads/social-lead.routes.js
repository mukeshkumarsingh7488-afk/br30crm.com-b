const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requireManagementRole } = require("../../middleware/permission");
const controller = require("./social-lead.controller");
const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

router.get("/:businessId/config", auth, requireBusinessMembership, controller.getConfig);
router.post("/:businessId/rotate-secret", auth, requireBusinessMembership, requireManagementRole, controller.rotateSecret);
router.get("/:businessId/:source/verify", controller.verify);
router.post("/:businessId/:source", limiter, controller.ingest);

module.exports = router;
