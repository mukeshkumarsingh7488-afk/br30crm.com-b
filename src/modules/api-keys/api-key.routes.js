const express = require("express");

const apiKeyController = require("./api-key.controller");

const { createApiKeyValidator, getApiKeysValidator, getApiKeyValidator, updateApiKeyValidator, deleteApiKeyValidator } = require("./api-key.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getApiKeysValidator, validate, requireBusinessMembership, requirePermission("api-keys.view"), apiKeyController.getApiKeysByBusiness);

router.post("/business/:businessId", createApiKeyValidator, validate, requireBusinessMembership, requirePermission("api-keys.create"), apiKeyController.createApiKey);

router.get("/business/:businessId/:apiKeyId", getApiKeyValidator, validate, requireBusinessMembership, requirePermission("api-keys.view"), apiKeyController.getApiKeyById);

router.patch("/business/:businessId/:apiKeyId", updateApiKeyValidator, validate, requireBusinessMembership, requirePermission("api-keys.update"), apiKeyController.updateApiKey);

router.delete("/business/:businessId/:apiKeyId", deleteApiKeyValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("api-keys.delete"), apiKeyController.deleteApiKey);

module.exports = router;
