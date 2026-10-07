const express = require("express");
const roleController = require("./role.controller");

const { createRoleValidator, updateRoleValidator, deleteRoleValidator, getRoleValidator, getRolesValidator, getAvailableRolesValidator, createSystemRolesValidator } = require("./role.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership, requireMasterAdmin } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.post("/system", createSystemRolesValidator, validate, requireMasterAdmin, roleController.createSystemRoles);

router.get("/business/:businessId", getRolesValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getRolesByBusiness);

router.get("/business/:businessId/available", getAvailableRolesValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getAllAvailableRoles);

router.post("/business/:businessId", createRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.create"), roleController.createRole);

router.patch("/business/:businessId/:roleId", updateRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.update"), roleController.updateRole);

router.delete("/business/:businessId/:roleId", deleteRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.delete"), roleController.deleteRole);

router.get("/:roleId", getRoleValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getRoleById);

module.exports = router;
