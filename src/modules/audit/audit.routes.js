const express = require("express");

const auth = require("../../middleware/auth");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const validate = require("../../middleware/validation");

const auditController = require("./audit.controller");
const { businessIdValidator, auditIdValidator, entityAuditValidator, listAuditValidator } = require("./audit.validator");

const router = express.Router();

router.get("/business/:businessId", [...listAuditValidator, validate, auth, requireBusinessMembership, requirePermission("audit.view")], auditController.getAuditLogs);

router.get("/business/:businessId/:auditId", [...businessIdValidator, ...auditIdValidator, validate, auth, requireBusinessMembership, requirePermission("audit.view")], auditController.getAuditLogById);

router.get("/business/:businessId/entity/:entityType/:entityId", [...entityAuditValidator, validate, auth, requireBusinessMembership, requirePermission("audit.view")], auditController.getEntityAuditLogs);

module.exports = router;
