const express = require("express");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const c = require("./public-form.controller");
const validator = require("./public-form.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authenticated Form Management
|--------------------------------------------------------------------------
*/

router.get("/business/:businessId", auth, validator.list, validate, requireBusinessMembership, requirePermission("forms.view"), c.list);

router.post("/business/:businessId", auth, validator.create, validate, requireBusinessMembership, requirePermission("forms.create"), c.create);

router.patch("/business/:businessId/:formId", auth, validator.update, validate, requireBusinessMembership, requirePermission("forms.update"), c.update);

router.delete("/business/:businessId/:formId", auth, validator.byId, validate, requireBusinessMembership, requireManagementRole, requirePermission("forms.delete"), c.remove);

/*
|--------------------------------------------------------------------------
| Public Form
|--------------------------------------------------------------------------
|
| These endpoints intentionally do not require authentication.
|
*/

router.get("/public/:businessId/:slug", validator.publicGet, validate, c.publicGet);

router.post("/public/:businessId/:slug/submit", validator.publicSubmit, validate, c.submit);

router.get("/public/:businessId/:slug/qr", validator.publicGet, validate, c.qr);

module.exports = router;
