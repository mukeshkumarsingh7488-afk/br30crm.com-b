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

router.post("/system", createSystemPermissionsValidator, validate, requireMasterAdmin, permissionController.initializeSystemPermissions);

router.get("/system", getSystemPermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getSystemPermissions);

router.get("/business/:businessId/available", getAvailablePermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getAllAvailablePermissions);

router.get("/business/:businessId", getBusinessPermissionsValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getBusinessPermissions);

router.post("/business/:businessId", createPermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.add"), permissionController.createPermission);

router.get("/slug/:slug", getPermissionBySlugValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getPermissionBySlug);

router.patch("/:permissionId", updatePermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.manage"), permissionController.updatePermission);

router.delete("/:permissionId", deletePermissionValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("permissions.manage"), permissionController.deletePermission);

router.get("/:permissionId", getPermissionValidator, validate, requireBusinessMembership, requirePermission("permissions.view"), permissionController.getPermissionById);

module.exports = router;
