const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const roleService = require("./role.service");

const createSystemRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.createSystemRoles({
    createdBy: req.user.userId,
  });

  return ApiResponse.success(
    res,
    {
      roles,
      count: roles.length,
    },
    "System roles initialized successfully."
  );
});

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { role }, "Role created successfully.");
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.roleId, req.businessId);

  return ApiResponse.success(res, { role }, "Role fetched successfully.");
});

const getRolesByBusiness = asyncHandler(async (req, res) => {
  const roles = await roleService.getRolesByBusiness(req.params.businessId, {
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(
    res,
    {
      roles,
      count: roles.length,
    },
    "Business roles fetched successfully."
  );
});

const getAllAvailableRoles = asyncHandler(async (req, res) => {
  const result = await roleService.getAllAvailableRoles(req.params.businessId, {
    includeInactive: req.query.includeInactive === "true",
  });

  return ApiResponse.success(res, result, "Available roles fetched successfully.");
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.roleId, req.body, req.user.userId, req.businessId);

  return ApiResponse.success(res, { role }, "Role updated successfully.");
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await roleService.deleteRole(req.params.roleId, req.user.userId, req.businessId);

  return ApiResponse.success(res, { role }, "Role deactivated successfully.");
});

module.exports = {
  createSystemRoles,
  createRole,
  getRoleById,
  getRolesByBusiness,
  getAllAvailableRoles,
  updateRole,
  deleteRole,
};
