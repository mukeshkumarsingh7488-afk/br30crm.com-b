const express = require("express");

const businessMemberController = require("./business-member.controller");

const { businessIdValidator, memberIdValidator, paginationValidators, addMemberValidator, updateMemberValidator, memberDetailsValidator } = require("./business-member.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Get all businesses where the logged-in user
 * has an active/inactive/suspended membership.
 *
 * This endpoint does not belong to one specific business.
 */
router.get("/me", paginationValidators, validate, businessMemberController.getMyBusinessMemberships);

/*
 * Add a user to a business.
 *
 * Required permission:
 * users.create
 */
router.post("/:businessId/members", [...businessIdValidator, ...addMemberValidator], validate, requireBusinessMembership, requireManagementRole, requirePermission("users.create"), businessMemberController.addMember);

/*
 * Get all members of a business.
 *
 * Required permission:
 * users.view
 */
router.get(
  "/:businessId/assignment-members",
  [...businessIdValidator, ...paginationValidators],
  validate,
  requireBusinessMembership,
  businessMemberController.getAssignmentMembersByBusiness
);

router.get("/:businessId/members", [...businessIdValidator, ...paginationValidators], validate, requireBusinessMembership, requirePermission("users.view"), businessMemberController.getMembersByBusiness);

/*
 * Get a specific business member.
 *
 * Required permission:
 * users.view
 */
router.get("/member/:memberId", memberDetailsValidator, validate, requireBusinessMembership, requirePermission("users.view"), businessMemberController.getMemberById);

/*
 * Update member role/status.
 *
 * Required permission:
 * users.update
 */
router.patch("/member/:memberId", updateMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("users.update"), businessMemberController.updateMember);

/*
 * Permanently delete a business member.
 *
 * Required permission:
 * users.delete
 */
router.delete("/member/:memberId", memberIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("users.delete"), businessMemberController.removeMember);

module.exports = router;
