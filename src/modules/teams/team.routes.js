const express = require("express");

const teamController = require("./team.controller");

const { createTeamValidator, updateTeamValidator, getTeamValidator, addTeamMemberValidator, removeTeamMemberValidator, paginationValidators } = require("./team.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Get all teams of a business.
 */
router.get("/business/:businessId", [...paginationValidators], validate, requireBusinessMembership, requirePermission("teams.view"), teamController.getTeamsByBusiness);

/*
 * Create team.
 */
router.post("/business/:businessId", createTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.create"), teamController.createTeam);

/*
 * Get specific team.
 */
router.get("/business/:businessId/:teamId", getTeamValidator, validate, requireBusinessMembership, requirePermission("teams.view"), teamController.getTeamById);

/*
 * Update team.
 */
router.patch("/business/:businessId/:teamId", updateTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.updateTeam);

/*
 * Delete/deactivate team.
 */
router.delete("/business/:businessId/:teamId", getTeamValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.delete"), teamController.deleteTeam);

/*
 * Add member to team.
 */
router.post("/business/:businessId/:teamId/members/:userId", addTeamMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.addTeamMember);

/*
 * Remove member from team.
 */
router.delete("/business/:businessId/:teamId/members/:userId", removeTeamMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("teams.update"), teamController.removeTeamMember);

module.exports = router;
