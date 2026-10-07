const express = require("express");

const auth = require("../../middleware/auth");
const { requireMasterAdmin } = require("../../middleware/authorization");
const validate = require("../../middleware/validation");
const { requirePermission } = require("../../middleware/permission");

const whatsNewController = require("./whats-new.controller");

const { objectIdValidator, slugValidator, createWhatsNewValidator, updateWhatsNewValidator, listWhatsNewValidator, statusValidator } = require("./whats-new.validator");

const router = express.Router();

router.get("/", listWhatsNewValidator, validate, whatsNewController.getPublicWhatsNew);

router.get("/slug/:slug", slugValidator, validate, whatsNewController.getPublicWhatsNewBySlug);

router.use(auth);

router.use(requireMasterAdmin);

router.get("/admin", listWhatsNewValidator, validate, requirePermission("whatsnew.view"), whatsNewController.getAllWhatsNew);

router.get("/admin/:whatsNewId", objectIdValidator, validate, requirePermission("whatsnew.view"), whatsNewController.getWhatsNewById);

router.post("/admin", requirePermission("whatsnew.create"), createWhatsNewValidator, validate, whatsNewController.createWhatsNew);

router.patch("/admin/:whatsNewId", requirePermission("whatsnew.update"), updateWhatsNewValidator, validate, whatsNewController.updateWhatsNew);

router.patch("/admin/:whatsNewId/status", statusValidator, validate, requirePermission("whatsnew.update"), whatsNewController.updateStatus);

router.delete("/admin/:whatsNewId", objectIdValidator, validate, requirePermission("whatsnew.delete"), whatsNewController.deleteWhatsNew);

module.exports = router;
