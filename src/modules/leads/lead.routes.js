const express = require("express");

const leadController = require("./lead.controller");

const { createLeadValidator, updateLeadValidator, getLeadsValidator, getLeadValidator, assignLeadValidator, convertLeadValidator, deleteLeadValidator } = require("./lead.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireAllPermissions, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getLeadsValidator, validate, requireBusinessMembership, requirePermission("leads.view"), leadController.getLeadsByBusiness);

router.post("/business/:businessId", createLeadValidator, validate, requireBusinessMembership, requirePermission("leads.create"), leadController.createLead);

router.get("/business/:businessId/:leadId", getLeadValidator, validate, requireBusinessMembership, requirePermission("leads.view"), leadController.getLeadById);

router.patch("/business/:businessId/:leadId", updateLeadValidator, validate, requireBusinessMembership, requirePermission("leads.update"), leadController.updateLead);

router.patch("/business/:businessId/:leadId/assign", assignLeadValidator, validate, requireBusinessMembership, requirePermission("leads.assign"), leadController.assignLead);

router.post("/business/:businessId/:leadId/convert", convertLeadValidator, validate, requireBusinessMembership, requireAllPermissions(["leads.convert", "contacts.create", "companies.create"]), leadController.convertLead);

router.delete("/business/:businessId/:leadId", deleteLeadValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("leads.delete"), leadController.deleteLead);

module.exports = router;
