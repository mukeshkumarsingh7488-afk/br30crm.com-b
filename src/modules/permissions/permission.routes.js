const express = require("express");
const permissionController = require("./permission.controller");

const {
  permissionIdValidator,
  businessIdValidator,
  getPermissionValidator,
  getPermissionBySlugValidator,
  createPermissionValidator,
  updatePermissionValidator,
  deletePermissionValidator,
  getBusinessPermissionsValidator,
  getAvailablePermissionsValidator,
  getSystemPermissionsValidator,
  createSystemPermissionsValidator,
} = require("./permission.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership, requireMasterAdmin } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Initialize system permissions
 */
router.post("/system", createSystemPermissionsValidator, validate, requireMasterAdmin, permissionController.initializeSystemPermissions);

/*
 * System permissions
 */
router.get("/system", getSystemPermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getSystemPermissions);

/*
 * Available permissions for a business
 */
router.get("/business/:businessId/available", getAvailablePermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getAllAvailablePermissions);

/*
 * Business custom permissions
 */
router.get("/business/:businessId", getBusinessPermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getBusinessPermissions);

/*
 * Create business custom permission
 */
router.post("/business/:businessId", createPermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.add"), permissionController.createPermission);

/*
 * Permission by slug
 */
router.get("/slug/:slug", getPermissionBySlugValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getPermissionBySlug);

/*
 * Update permission
 */
router.patch("/:permissionId", updatePermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.manage"), permissionController.updatePermission);

/*
 * Delete/deactivate permission
 */
router.delete("/:permissionId", deletePermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.manage"), permissionController.deletePermission);

/*
 * Permission by ID
 */
router.get("/:permissionId", getPermissionValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getPermissionById);

module.exports = router;
