const express = require("express");

const contactController = require("./contact.controller");

const { createContactValidator, updateContactValidator, getContactsValidator, getContactValidator, assignContactValidator, deleteContactValidator } = require("./contact.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getContactsValidator, validate, requireBusinessMembership, requirePermission("contacts.view"), contactController.getContactsByBusiness);

router.post("/business/:businessId", createContactValidator, validate, requireBusinessMembership, requirePermission("contacts.create"), contactController.createContact);

router.get("/business/:businessId/:contactId", getContactValidator, validate, requireBusinessMembership, requirePermission("contacts.view"), contactController.getContactById);

router.patch("/business/:businessId/:contactId", updateContactValidator, validate, requireBusinessMembership, requirePermission("contacts.update"), contactController.updateContact);

router.patch("/business/:businessId/:contactId/assign", assignContactValidator, validate, requireBusinessMembership, requirePermission("contacts.assign"), contactController.assignContact);

router.delete("/business/:businessId/:contactId", deleteContactValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("contacts.delete"), contactController.deleteContact);

module.exports = router;
