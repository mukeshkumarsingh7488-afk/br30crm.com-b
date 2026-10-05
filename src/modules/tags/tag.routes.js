const express = require("express");

const tagController = require("./tag.controller");

const { createTagValidator, updateTagValidator, tagIdValidator, paginationValidators } = require("./tag.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.post("/business/:businessId", createTagValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("tags.create"), tagController.createTag);

router.get("/business/:businessId", paginationValidators, validate, requireBusinessMembership, requirePermission("tags.view"), tagController.getTagsByBusiness);

router.get("/business/:businessId/:tagId", tagIdValidator, validate, requireBusinessMembership, requirePermission("tags.view"), tagController.getTagById);

router.patch("/business/:businessId/:tagId", updateTagValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("tags.update"), tagController.updateTag);

router.delete("/business/:businessId/:tagId", tagIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("tags.delete"), tagController.deleteTag);

router.patch("/business/:businessId/:tagId/restore", tagIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("tags.update"), tagController.restoreTag);

module.exports = router;
