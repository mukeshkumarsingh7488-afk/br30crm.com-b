const express = require("express");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const c = require("./communication.controller");
const w = require("./communication.webhook.controller");
const { sendValidator, listValidator, businessId } = require("./communication.validator");
const router = express.Router();

router.get("/webhooks/whatsapp/:integrationId", w.whatsappVerify);
router.post("/webhooks/whatsapp/:integrationId", w.whatsapp);
router.post("/webhooks/sms/:integrationId", w.sms);
router.post("/webhooks/email/:integrationId", w.emailGeneric);

router.use(auth);
router.get("/business/:businessId", listValidator, validate, requireBusinessMembership, requirePermission("communications.view"), c.list);
router.get("/business/:businessId/senders", businessId, validate, requireBusinessMembership, requirePermission("communications.view"), c.senders);
router.post("/business/:businessId/send", sendValidator, validate, requireBusinessMembership, requirePermission("communications.send"), c.send);
module.exports = router;
