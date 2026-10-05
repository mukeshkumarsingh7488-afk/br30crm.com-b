const express = require("express");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const controller = require("./lead-attribution.controller");
const validator = require("./lead-attribution.validator");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId/summary", validator.summary, validate, requireBusinessMembership, requirePermission("lead-attribution.view"), controller.summary);

router.get("/business/:businessId/lead/:leadId", validator.lead, validate, requireBusinessMembership, requirePermission("lead-attribution.view"), controller.listByLead);

router.get("/business/:businessId/lead/:leadId/summary", validator.lead, validate, requireBusinessMembership, requirePermission("lead-attribution.view"), controller.getLeadAttribution);

router.post("/business/:businessId/lead/:leadId", validator.create, validate, requireBusinessMembership, requirePermission("lead-attribution.create"), controller.create);

router.post("/business/:businessId/lead/:leadId/first-touch", validator.create, validate, requireBusinessMembership, requirePermission("lead-attribution.create"), controller.firstTouch);

router.post("/business/:businessId/lead/:leadId/last-touch", validator.create, validate, requireBusinessMembership, requirePermission("lead-attribution.create"), controller.lastTouch);

router.patch("/business/:businessId/:attributionId", validator.update, validate, requireBusinessMembership, requirePermission("lead-attribution.update"), controller.update);

router.delete("/business/:businessId/:attributionId", validator.byId, validate, requireBusinessMembership, requireManagementRole, requirePermission("lead-attribution.delete"), controller.remove);

module.exports = router;
