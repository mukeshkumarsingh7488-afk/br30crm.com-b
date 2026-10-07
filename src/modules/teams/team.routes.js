const express = require("express");

const teamController = require("./team.controller");

const { createTeamValidator, updateTeamValidator, getTeamValidator, addTeamMemberValidator, removeTeamMemberValidator, paginationValidators } = require("./team.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", [...paginationValidators], validate, requireBusinessMembership, requirePermission("teams.view"), teamController.getTeamsByBusiness);

router.post("/business/:businessId", createTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.create"), teamController.createTeam);

router.get("/business/:businessId/:teamId", getTeamValidator, validate, requireBusinessMembership, requirePermission("teams.view"), teamController.getTeamById);

router.patch("/business/:businessId/:teamId", updateTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.updateTeam);

router.delete("/business/:businessId/:teamId", getTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.delete"), teamController.deleteTeam);

router.post("/business/:businessId/:teamId/members/:userId", addTeamMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.addTeamMember);

router.delete("/business/:businessId/:teamId/members/:userId", removeTeamMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.removeTeamMember);

module.exports = router;
