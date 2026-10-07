const ApiError = require("../utils/ApiError");
const Permission = require("../modules/permissions/permission.model");
const BusinessPermissionState = require("../modules/permissions/business-permission-state.model");

const isMasterAdminRequest = (req) => {
  return req?.isMasterAdmin === true;
};

const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!requiredPermission) {
        return next(new ApiError(500, "Permission requirement is not configured."));
      }

      if (!req.user?.userId) {
        return next(new ApiError(401, "Authentication required."));
      }

      if (isMasterAdminRequest(req)) {
        req.permission = requiredPermission;
        req.isMasterAdmin = true;

        return next();
      }

      if (!req.businessMember || !req.role) {
        return next(new ApiError(403, "Business authorization is required."));
      }

      if (req.businessMember.status !== "ACTIVE") {
        return next(new ApiError(403, "Your business membership is inactive."));
      }

      if (req.isBusinessOwner === true) {
        req.permission = requiredPermission;
        req.isBusinessOwner = true;
        return next();
      }

      if (!req.role.isActive) {
        return next(new ApiError(403, "Your assigned role is inactive."));
      }

      const permissions = await Permission.find({
        _id: { $in: req.role.permissions || [] },
        isActive: true,
      })
        .select("slug module action type businessId")
        .lean();

      const systemIds = permissions.filter((permission) => permission.type === "SYSTEM").map((permission) => permission._id);
      const inactiveSystemStates =
        systemIds.length && req.businessId
          ? await BusinessPermissionState.find({
              businessId: req.businessId,
              permissionId: { $in: systemIds },
              isActive: false,
            })
              .select("permissionId")
              .lean()
          : [];
      const inactiveSystemIds = new Set(inactiveSystemStates.map((state) => String(state.permissionId)));
      const effectivePermissions = permissions.filter((permission) => permission.type !== "SYSTEM" || !inactiveSystemIds.has(String(permission._id)));

      const hasPermission = effectivePermissions.some((permission) => permission.slug === requiredPermission);

      if (!hasPermission) {
        return next(new ApiError(403, `Permission denied. Required permission: ${requiredPermission}`));
      }

      req.permission = requiredPermission;

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const requireAnyPermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
        return next(new ApiError(500, "Permission requirements are not configured."));
      }

      if (!req.user?.userId) {
        return next(new ApiError(401, "Authentication required."));
      }

      if (isMasterAdminRequest(req)) {
        req.permissions = [...requiredPermissions];
        req.isMasterAdmin = true;

        return next();
      }

      if (!req.businessMember || !req.role) {
        return next(new ApiError(403, "Business authorization is required."));
      }

      if (req.businessMember.status !== "ACTIVE") {
        return next(new ApiError(403, "Your business membership is inactive."));
      }

      if (req.isBusinessOwner === true) {
        req.permissions = [...requiredPermissions];
        req.isBusinessOwner = true;
        return next();
      }

      if (!req.role.isActive) {
        return next(new ApiError(403, "Your assigned role is inactive."));
      }

      const permissions = await Permission.find({
        _id: { $in: req.role.permissions || [] },
        isActive: true,
      })
        .select("slug module action type businessId")
        .lean();

      const systemIds = permissions.filter((permission) => permission.type === "SYSTEM").map((permission) => permission._id);
      const inactiveSystemStates =
        systemIds.length && req.businessId
          ? await BusinessPermissionState.find({
              businessId: req.businessId,
              permissionId: { $in: systemIds },
              isActive: false,
            })
              .select("permissionId")
              .lean()
          : [];
      const inactiveSystemIds = new Set(inactiveSystemStates.map((state) => String(state.permissionId)));
      const effectivePermissions = permissions.filter((permission) => permission.type !== "SYSTEM" || !inactiveSystemIds.has(String(permission._id)));

      const userPermissionSlugs = new Set(effectivePermissions.map((permission) => permission.slug));

      const hasPermission = requiredPermissions.some((permission) => userPermissionSlugs.has(permission));

      if (!hasPermission) {
        return next(new ApiError(403, "Permission denied. You do not have any of the required permissions."));
      }

      req.permissions = requiredPermissions.filter((permission) => userPermissionSlugs.has(permission));

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const requireAllPermissions = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
        return next(new ApiError(500, "Permission requirements are not configured."));
      }

      if (!req.user?.userId) {
        return next(new ApiError(401, "Authentication required."));
      }

      if (isMasterAdminRequest(req)) {
        req.permissions = [...requiredPermissions];
        req.isMasterAdmin = true;

        return next();
      }

      if (!req.businessMember || !req.role) {
        return next(new ApiError(403, "Business authorization is required."));
      }

      if (req.businessMember.status !== "ACTIVE") {
        return next(new ApiError(403, "Your business membership is inactive."));
      }

      if (req.isBusinessOwner === true) {
        req.permissions = [...requiredPermissions];
        req.isBusinessOwner = true;
        return next();
      }

      if (!req.role.isActive) {
        return next(new ApiError(403, "Your assigned role is inactive."));
      }

      const permissions = await Permission.find({
        _id: { $in: req.role.permissions || [] },
        isActive: true,
      })
        .select("slug module action type businessId")
        .lean();

      const systemIds = permissions.filter((permission) => permission.type === "SYSTEM").map((permission) => permission._id);
      const inactiveSystemStates =
        systemIds.length && req.businessId
          ? await BusinessPermissionState.find({
              businessId: req.businessId,
              permissionId: { $in: systemIds },
              isActive: false,
            })
              .select("permissionId")
              .lean()
          : [];
      const inactiveSystemIds = new Set(inactiveSystemStates.map((state) => String(state.permissionId)));
      const effectivePermissions = permissions.filter((permission) => permission.type !== "SYSTEM" || !inactiveSystemIds.has(String(permission._id)));

      const userPermissionSlugs = new Set(effectivePermissions.map((permission) => permission.slug));

      const hasAllPermissions = requiredPermissions.every((permission) => userPermissionSlugs.has(permission));

      if (!hasAllPermissions) {
        return next(new ApiError(403, "Permission denied. You do not have all required permissions."));
      }

      req.permissions = [...requiredPermissions];

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const requireManagementRole = async (req, res, next) => {
  try {
    if (!req.user?.userId) return next(new ApiError(401, "Authentication required."));
    if (isMasterAdminRequest(req) || req.isBusinessOwner === true) return next();

    const roleSlug = String(req.role?.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
    const roleName = String(req.role?.name || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
    const isManagerRole = roleSlug === "manager" || roleSlug === "team-manager" || roleSlug.endsWith("-manager") || roleName === "manager" || roleName === "team-manager" || roleName.endsWith("-manager");

    if (isManagerRole) return next();

    const Team = require("../modules/teams/team.model");
    const managedTeam = await Team.exists({ businessId: req.businessId, managerId: req.user.userId, status: { $in: ["ACTIVE", "INACTIVE"] } });
    if (managedTeam) return next();

    return next(new ApiError(403, "Manager or Team Manager access is required."));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireManagementRole,
};
