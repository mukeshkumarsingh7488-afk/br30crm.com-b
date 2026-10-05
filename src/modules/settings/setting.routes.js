const express = require("express");

const auth = require("../../middleware/auth");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const validate = require("../../middleware/validation");

const settingController = require("./setting.controller");

const { businessIdValidator, settingsBodyValidator } = require("./setting.validator");

const router = express.Router();

router.get("/business/:businessId", [...businessIdValidator, validate, auth, requireBusinessMembership, requirePermission("settings.view")], settingController.getSettings);

router.post("/business/:businessId", [...businessIdValidator, ...settingsBodyValidator, validate, auth, requireBusinessMembership, requirePermission("settings.create")], settingController.createSettings);

router.patch("/business/:businessId", [...businessIdValidator, ...settingsBodyValidator, validate, auth, requireBusinessMembership, requirePermission("settings.update")], settingController.updateSettings);

router.post("/business/:businessId/reset", [...businessIdValidator, validate, auth, requireBusinessMembership, requirePermission("settings.update")], settingController.resetSettings);

module.exports = router;
