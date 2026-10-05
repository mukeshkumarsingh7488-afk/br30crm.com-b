const express = require("express");

const invitationController = require("./invitation.controller");

const { createInvitationValidator, getInvitationsValidator, getInvitationValidator, acceptInvitationValidator, resendInvitationValidator, cancelInvitationValidator } = require("./invitation.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getInvitationsValidator, validate, requireBusinessMembership, requirePermission("invitations.view"), invitationController.getInvitationsByBusiness);

router.post("/business/:businessId", createInvitationValidator, validate, requireBusinessMembership, requirePermission("invitations.create"), invitationController.createInvitation);

router.post("/business/:businessId/:invitationId/resend", resendInvitationValidator, validate, requireBusinessMembership, requirePermission("invitations.create"), invitationController.resendInvitation);

router.delete("/business/:businessId/:invitationId", cancelInvitationValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("invitations.delete"), invitationController.cancelInvitation);

router.post("/accept", acceptInvitationValidator, validate, invitationController.acceptInvitation);

router.get("/:invitationId", getInvitationValidator, validate, invitationController.getInvitationById);

module.exports = router;
