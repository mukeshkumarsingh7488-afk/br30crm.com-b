const express = require("express");
const roleController = require("./role.controller");

const { createRoleValidator, updateRoleValidator, deleteRoleValidator, getRoleValidator, getRolesValidator, getAvailableRolesValidator, createSystemRolesValidator } = require("./role.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership, requireMasterAdmin } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Initialize system roles
 */
router.post("/system", createSystemRolesValidator, validate, requireMasterAdmin, roleController.createSystemRoles);

/*
 * Business roles
 */
router.get("/business/:businessId", getRolesValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getRolesByBusiness);

/*
 * Available roles for a business
 */
router.get("/business/:businessId/available", getAvailableRolesValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getAllAvailableRoles);

/*
 * Create custom business role
 */
router.post("/business/:businessId", createRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.create"), roleController.createRole);

/*
 * Update custom business role
 */
router.patch("/business/:businessId/:roleId", updateRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.update"), roleController.updateRole);

/*
 * Delete/deactivate custom business role
 */
router.delete("/business/:businessId/:roleId", deleteRoleValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("roles.delete"), roleController.deleteRole);

/*
 * Role by ID
 */
router.get("/:roleId", getRoleValidator, validate, requireBusinessMembership, requirePermission("roles.view"), roleController.getRoleById);

module.exports = router;
