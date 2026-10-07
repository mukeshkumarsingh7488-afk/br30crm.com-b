const express = require("express");

const businessMemberController = require("./business-member.controller");

const { businessIdValidator, memberIdValidator, paginationValidators, addMemberValidator, updateMemberValidator, memberDetailsValidator } = require("./business-member.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/me", paginationValidators, validate, businessMemberController.getMyBusinessMemberships);

router.post("/:businessId/members", [...businessIdValidator, ...addMemberValidator], validate, requireBusinessMembership, requireManagementRole, requirePermission("users.create"), businessMemberController.addMember);

router.get("/:businessId/assignment-members", [...businessIdValidator, ...paginationValidators], validate, requireBusinessMembership, businessMemberController.getAssignmentMembersByBusiness);

router.get("/:businessId/members", [...businessIdValidator, ...paginationValidators], validate, requireBusinessMembership, requirePermission("users.view"), businessMemberController.getMembersByBusiness);

router.get("/member/:memberId", memberDetailsValidator, validate, requireBusinessMembership, requirePermission("users.view"), businessMemberController.getMemberById);

router.patch("/member/:memberId", updateMemberValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("users.update"), businessMemberController.updateMember);

router.delete("/member/:memberId", memberIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("users.delete"), businessMemberController.removeMember);

module.exports = router;
