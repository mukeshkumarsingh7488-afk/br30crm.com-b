const express = require("express");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const controller = require("./lead-source.controller");
const validator = require("./lead-source.validator");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", validator.list, validate, requireBusinessMembership, requirePermission("lead-sources.view"), controller.list);

router.post("/business/:businessId", validator.create, validate, requireBusinessMembership, requirePermission("lead-sources.create"), controller.create);

router.patch("/business/:businessId/:sourceId", validator.update, validate, requireBusinessMembership, requirePermission("lead-sources.update"), controller.update);

router.delete("/business/:businessId/:sourceId", validator.byId, validate, requireBusinessMembership, requireManagementRole, requirePermission("lead-sources.delete"), controller.remove);

router.patch("/business/:businessId/:sourceId/toggle", validator.byId, validate, requireBusinessMembership, requirePermission("lead-sources.update"), controller.toggle);

router.get("/business/:businessId/:sourceId/link", validator.link, validate, requireBusinessMembership, requirePermission("lead-sources.view"), controller.link);

module.exports = router;
