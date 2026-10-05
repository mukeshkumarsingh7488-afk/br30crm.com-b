const express = require("express");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const controller = require("./qr.controller");
const validator = require("./qr.validator");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", validator.list, validate, requireBusinessMembership, requirePermission("forms.view"), controller.list);

router.get("/business/:businessId/:qrId", validator.byId, validate, requireBusinessMembership, requirePermission("forms.view"), controller.getById);

router.post("/business/:businessId", validator.create, validate, requireBusinessMembership, requirePermission("forms.create"), controller.create);

router.patch("/business/:businessId/:qrId", validator.update, validate, requireBusinessMembership, requirePermission("forms.update"), controller.update);

router.delete("/business/:businessId/:qrId", validator.byId, validate, requireBusinessMembership, requireManagementRole, requirePermission("forms.delete"), controller.remove);

router.post("/business/:businessId/:qrId/regenerate", validator.regenerate, validate, requireBusinessMembership, requirePermission("forms.update"), controller.regenerate);

router.get("/business/:businessId/:qrId/image", validator.byId, validate, requireBusinessMembership, requirePermission("forms.view"), controller.image);

module.exports = router;
