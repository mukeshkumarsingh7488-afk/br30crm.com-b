const express = require("express");

const integrationController = require("./integration.controller");

const { createIntegrationValidator, getIntegrationsValidator, getIntegrationValidator, updateIntegrationValidator, updateIntegrationStatusValidator, deleteIntegrationValidator } = require("./integration.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getIntegrationsValidator, validate, requireBusinessMembership, requirePermission("integrations.view"), integrationController.getIntegrationsByBusiness);

router.post("/business/:businessId", createIntegrationValidator, validate, requireBusinessMembership, requirePermission("integrations.create"), integrationController.createIntegration);

router.get("/business/:businessId/:integrationId", getIntegrationValidator, validate, requireBusinessMembership, requirePermission("integrations.view"), integrationController.getIntegrationById);

router.patch("/business/:businessId/:integrationId", updateIntegrationValidator, validate, requireBusinessMembership, requirePermission("integrations.update"), integrationController.updateIntegration);

router.patch("/business/:businessId/:integrationId/status", updateIntegrationStatusValidator, validate, requireBusinessMembership, requirePermission("integrations.update"), integrationController.updateIntegrationStatus);

router.delete("/business/:businessId/:integrationId", deleteIntegrationValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("integrations.delete"), integrationController.deleteIntegration);

module.exports = router;
