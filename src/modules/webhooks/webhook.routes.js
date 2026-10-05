const express = require("express");

const webhookController = require("./webhook.controller");

const { createWebhookValidator, getWebhooksValidator, getWebhookValidator, updateWebhookValidator, regenerateWebhookSecretValidator, deleteWebhookValidator, deliveryIdValidator, deliveryListValidator } = require("./webhook.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getWebhooksValidator, validate, requireBusinessMembership, requirePermission("webhooks.view"), webhookController.getWebhooksByBusiness);

router.post("/business/:businessId", createWebhookValidator, validate, requireBusinessMembership, requirePermission("webhooks.create"), webhookController.createWebhook);

router.get("/business/:businessId/:webhookId", getWebhookValidator, validate, requireBusinessMembership, requirePermission("webhooks.view"), webhookController.getWebhookById);

router.patch("/business/:businessId/:webhookId", updateWebhookValidator, validate, requireBusinessMembership, requirePermission("webhooks.update"), webhookController.updateWebhook);

router.patch("/business/:businessId/:webhookId/regenerate-secret", regenerateWebhookSecretValidator, validate, requireBusinessMembership, requirePermission("webhooks.update"), webhookController.regenerateWebhookSecret);

router.post("/business/:businessId/:webhookId/test", getWebhookValidator, validate, requireBusinessMembership, requirePermission("webhooks.update"), webhookController.testWebhook);

router.get("/business/:businessId/:webhookId/deliveries", deliveryListValidator, validate, requireBusinessMembership, requirePermission("webhooks.view"), webhookController.getDeliveries);

router.get("/business/:businessId/deliveries/:deliveryId", deliveryIdValidator, validate, requireBusinessMembership, requirePermission("webhooks.view"), webhookController.getDeliveryById);

router.post("/business/:businessId/deliveries/:deliveryId/retry", deliveryIdValidator, validate, requireBusinessMembership, requirePermission("webhooks.update"), webhookController.retryDelivery);

router.delete("/business/:businessId/:webhookId", deleteWebhookValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("webhooks.delete"), webhookController.deleteWebhook);

module.exports = router;
