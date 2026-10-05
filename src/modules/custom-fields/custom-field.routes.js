const express = require("express");

const customFieldController = require("./custom-field.controller");

const { createCustomFieldValidator, updateCustomFieldValidator, customFieldIdValidator, paginationValidators, entityFieldsValidator } = require("./custom-field.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.post("/business/:businessId", createCustomFieldValidator, validate, requireBusinessMembership, requirePermission("custom-fields.create"), customFieldController.createCustomField);

router.get("/business/:businessId", paginationValidators, validate, requireBusinessMembership, requirePermission("custom-fields.view"), customFieldController.getCustomFieldsByBusiness);

router.get("/business/:businessId/entity/:entity", entityFieldsValidator, validate, requireBusinessMembership, requirePermission("custom-fields.view"), customFieldController.getCustomFieldsByEntity);

router.get("/business/:businessId/:customFieldId", customFieldIdValidator, validate, requireBusinessMembership, requirePermission("custom-fields.view"), customFieldController.getCustomFieldById);

router.patch("/business/:businessId/:customFieldId", updateCustomFieldValidator, validate, requireBusinessMembership, requirePermission("custom-fields.update"), customFieldController.updateCustomField);

router.delete("/business/:businessId/:customFieldId", customFieldIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("custom-fields.delete"), customFieldController.deleteCustomField);

router.patch("/business/:businessId/:customFieldId/restore", customFieldIdValidator, validate, requireBusinessMembership, requirePermission("custom-fields.update"), customFieldController.restoreCustomField);

module.exports = router;
