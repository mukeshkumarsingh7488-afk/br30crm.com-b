const express = require("express");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const controller = require("./search.controller");
const { searchValidator } = require("./search.validator");

const router = express.Router();
router.use(auth);
router.get("/business/:businessId", searchValidator, validate, requireBusinessMembership, requirePermission("search.view"), controller.search);
module.exports = router;
