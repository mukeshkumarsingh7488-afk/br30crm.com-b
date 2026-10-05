const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const permissionService = require("./permission.service");

const initializeSystemPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.initializeSystemPermissions({
    createdBy: req.user.userId,
  });

  return ApiResponse.success(
    res,
    {
      permissions,
      count: permissions.length,
    },
    "System permissions initialized successfully."
  );
});

const getPermissionById = asyncHandler(async (req, res) => {
  const permission = await permissionService.getPermissionById(req.params.permissionId, req.businessId);

  return ApiResponse.success(res, { permission }, "Permission fetched successfully.");
});

const getPermissionBySlug = asyncHandler(async (req, res) => {
  const permission = await permissionService.getPermissionBySlug(req.params.slug, req.businessId);

  return ApiResponse.success(res, { permission }, "Permission fetched successfully.");
});

const createPermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.createPermission({
    ...req.body,
    businessId: req.params.businessId || null,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { permission }, "Permission created successfully.");
});

const getSystemPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.getSystemPermissions({
    includeInactive: req.query.includeInactive === "true",
    businessId: req.businessId,
  });

  return ApiResponse.success(
    res,
    {
      permissions,
      count: permissions.length,
    },
    "System permissions fetched successfully."
  );
});

const getBusinessPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.getBusinessPermissions(req.params.businessId, {
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(
    res,
    {
      permissions,
      count: permissions.length,
    },
    "Business permissions fetched successfully."
  );
});

const getAllAvailablePermissions = asyncHandler(async (req, res) => {
  const result = await permissionService.getAllAvailablePermissions(req.params.businessId, {
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(res, result, "Available permissions fetched successfully.");
});

const updatePermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.updatePermission(req.params.permissionId, req.body, req.user.userId, req.businessId);

  return ApiResponse.success(res, { permission }, "Permission updated successfully.");
});

const deletePermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.deletePermission(req.params.permissionId, req.user.userId, req.businessId);

  return ApiResponse.success(res, { permission }, "Permission deactivated successfully.");
});

module.exports = {
  initializeSystemPermissions,
  getPermissionById,
  getPermissionBySlug,
  createPermission,
  getSystemPermissions,
  getBusinessPermissions,
  getAllAvailablePermissions,
  updatePermission,
  deletePermission,
};
