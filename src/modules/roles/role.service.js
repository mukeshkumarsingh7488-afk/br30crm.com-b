const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const Role = require("./role.model");
const Permission = require("../permissions/permission.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const permissionService = require("../permissions/permission.service");

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const resolveRolePermissionIds = async (permissionIds, businessId, { dropInactive = false } = {}) => {
  const uniqueIds = [...new Set((permissionIds || []).map(String))];
  if (!uniqueIds.length) return [];
  validateObjectId(businessId, "business ID");

  uniqueIds.forEach((permissionId) => validateObjectId(permissionId, "permission ID"));

  const scopedPermissions = await Permission.find({
    _id: { $in: uniqueIds },
    $or: [
      { businessId: null, type: "SYSTEM" },
      { businessId, type: "CUSTOM" },
    ],
  })
    .select("_id")
    .lean();

  const scopedIds = new Set(scopedPermissions.map((permission) => String(permission._id)));
  for (const permissionId of uniqueIds) {
    if (!scopedIds.has(permissionId)) {
      throw new ApiError(400, `Invalid permission: ${permissionId}`);
    }
  }

  const activeIds = await permissionService.getActivePermissionIdsForBusiness(uniqueIds, businessId);
  const activeSet = new Set(activeIds.map(String));

  if (!dropInactive) {
    for (const permissionId of uniqueIds) {
      if (!activeSet.has(permissionId)) {
        throw new ApiError(400, `Invalid or inactive permission: ${permissionId}`);
      }
    }
  }

  return uniqueIds.filter((permissionId) => activeSet.has(permissionId));
};

const SYSTEM_ROLE_DEFINITIONS = [
  {
    name: "Business Owner",
    slug: "business-owner",
    description: "Full access to the business CRM.",
    type: "SYSTEM",
    isDefault: true,
  },
  {
    name: "Administrator",
    slug: "administrator",
    description: "Administrative access to the business CRM.",
    type: "SYSTEM",
    isDefault: false,
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Manager access to the business CRM.",
    type: "SYSTEM",
    isDefault: false,
  },
  {
    name: "Sales",
    slug: "sales",
    description: "Sales access to the business CRM.",
    type: "SYSTEM",
    isDefault: false,
  },
  {
    name: "Support",
    slug: "support",
    description: "Support access to the business CRM.",
    type: "SYSTEM",
    isDefault: false,
  },
  {
    name: "Viewer",
    slug: "viewer",
    description: "Read-only access to the business CRM.",
    type: "SYSTEM",
    isDefault: false,
  },
];

const normalizeSlug = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

const getRoleById = async (roleId, businessId = null) => {
  validateObjectId(roleId, "role ID");

  if (businessId !== null) {
    validateObjectId(businessId, "business ID");
  }

  const filter = { _id: roleId };

  if (businessId !== null) {
    filter.$or = [{ businessId }, { businessId: null, type: "SYSTEM" }];
  }

  const role = await Role.findOne(filter).populate("permissions").populate("businessId", "name slug status");

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  return role;
};

const getRoleBySlug = async (slug, businessId = null) => {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new ApiError(400, "Role slug is required.");
  }

  if (businessId !== null) {
    validateObjectId(businessId, "business ID");
  }

  const role = await Role.findOne({
    slug: normalizedSlug,
    businessId,
  }).populate("permissions");

  return role;
};

const ensureSystemPermissions = async (createdBy) => {
  validateObjectId(createdBy, "creator ID");

  if (typeof permissionService.initializeSystemPermissions === "function") {
    return permissionService.initializeSystemPermissions({
      createdBy,
    });
  }

  if (typeof permissionService.ensureSystemPermissions === "function") {
    return permissionService.ensureSystemPermissions(createdBy);
  }

  if (typeof permissionService.seedSystemPermissions === "function") {
    return permissionService.seedSystemPermissions(createdBy);
  }

  throw new ApiError(500, "System permission initializer is not available in permission service.");
};

const getAllActiveSystemPermissions = async () => {
  return Permission.find({
    businessId: null,
    type: "SYSTEM",
    isActive: true,
  }).select("_id slug module action type businessId");
};

const ensureSystemRole = async ({ definition, createdBy, permissions = [] }) => {
  validateObjectId(createdBy, "creator ID");

  if (!definition?.slug) {
    throw new ApiError(500, "System role definition is invalid.");
  }

  const normalizedSlug = normalizeSlug(definition.slug);

  let role = await Role.findOne({
    businessId: null,
    slug: normalizedSlug,
  });

  if (!role) {
    role = await Role.create({
      name: definition.name,
      slug: normalizedSlug,
      description: definition.description || null,
      businessId: null,
      type: "SYSTEM",
      permissions,
      isDefault: Boolean(definition.isDefault),
      isActive: true,
      createdBy,
    });

    return role;
  }

  let changed = false;

  if (role.name !== definition.name) {
    role.name = definition.name;
    changed = true;
  }

  if (role.description !== (definition.description || null)) {
    role.description = definition.description || null;
    changed = true;
  }

  if (role.type !== "SYSTEM") {
    role.type = "SYSTEM";
    changed = true;
  }

  if (!role.isActive) {
    role.isActive = true;
    changed = true;
  }

  if (role.isDefault !== Boolean(definition.isDefault)) {
    role.isDefault = Boolean(definition.isDefault);
    changed = true;
  }

  if (changed) {
    role.updatedBy = createdBy;
    await role.save();
  }

  return role;
};

const ensureSystemRoles = async (createdBy) => {
  validateObjectId(createdBy, "creator ID");

  const permissions = await getAllActiveSystemPermissions();

  const permissionIds = permissions.map((permission) => permission._id);

  const roles = [];

  for (const definition of SYSTEM_ROLE_DEFINITIONS) {
    let rolePermissions = permissionIds;

    if (definition.slug !== "business-owner") {
      const existingRole = await Role.findOne({
        businessId: null,
        slug: normalizeSlug(definition.slug),
      }).select("permissions");

      if (existingRole?.permissions?.length) {
        rolePermissions = existingRole.permissions;
      } else {
        rolePermissions = [];
      }
    }

    const role = await ensureSystemRole({
      definition,
      createdBy,
      permissions: rolePermissions,
    });

    if (definition.slug === "business-owner") {
      const currentPermissionIds = new Set((role.permissions || []).map((id) => String(id)));

      let permissionsChanged = false;

      for (const permissionId of permissionIds) {
        if (!currentPermissionIds.has(String(permissionId))) {
          role.permissions.push(permissionId);
          permissionsChanged = true;
        }
      }

      const activePermissionIds = new Set(permissionIds.map((id) => String(id)));

      const cleanedPermissions = (role.permissions || []).filter((permissionId) => activePermissionIds.has(String(permissionId)));

      if (cleanedPermissions.length !== (role.permissions || []).length) {
        role.permissions = cleanedPermissions;
        permissionsChanged = true;
      }

      if (permissionsChanged) {
        role.updatedBy = createdBy;
        await role.save();
      }
    }

    roles.push(role);
  }

  return roles;
};

const getBusinessOwnerRole = async (createdBy) => {
  validateObjectId(createdBy, "creator ID");

  await ensureSystemPermissions(createdBy);

  await ensureSystemRoles(createdBy);

  const ownerRole = await Role.findOne({
    businessId: null,
    slug: "business-owner",
    type: "SYSTEM",
    isActive: true,
  });

  if (!ownerRole) {
    throw new ApiError(500, "Business Owner role could not be initialized.");
  }

  const permissions = await getAllActiveSystemPermissions();

  const permissionIds = permissions.map((permission) => permission._id);

  const currentIds = new Set((ownerRole.permissions || []).map((id) => String(id)));

  const activeIds = new Set(permissionIds.map((id) => String(id)));

  let changed = false;

  for (const permissionId of permissionIds) {
    if (!currentIds.has(String(permissionId))) {
      ownerRole.permissions.push(permissionId);
      changed = true;
    }
  }

  const cleanedPermissions = (ownerRole.permissions || []).filter((permissionId) => activeIds.has(String(permissionId)));

  if (cleanedPermissions.length !== (ownerRole.permissions || []).length) {
    ownerRole.permissions = cleanedPermissions;
    changed = true;
  }

  if (changed) {
    ownerRole.updatedBy = createdBy;
    await ownerRole.save();
  }

  return Role.findById(ownerRole._id).populate("permissions");
};

const repairAccessControl = async (createdBy = null) => {
  if (!createdBy) {
    const User = require("../users/user.model");

    const systemUser = await User.findOne({
      status: "ACTIVE",
    }).select("_id");

    if (!systemUser) {
      throw new ApiError(500, "No active user is available to repair access control.");
    }

    createdBy = systemUser._id;
  }

  validateObjectId(createdBy, "creator ID");

  await ensureSystemPermissions(createdBy);

  await ensureSystemRoles(createdBy);

  const ownerRole = await getBusinessOwnerRole(createdBy);

  const businesses = await Business.find({
    ownerId: { $ne: null },
  }).select("_id ownerId status");

  let repairedBusinesses = 0;
  let repairedMembers = 0;

  for (const business of businesses) {
    if (!business.ownerId) {
      continue;
    }

    const member = await BusinessMember.findOne({
      businessId: business._id,
      userId: business.ownerId,
    });

    if (!member) {
      await BusinessMember.create({
        businessId: business._id,
        userId: business.ownerId,
        roleId: ownerRole._id,
        status: "ACTIVE",
        invitedBy: null,
        createdBy,
      });

      repairedBusinesses += 1;
      repairedMembers += 1;

      continue;
    }

    let changed = false;

    if (!member.roleId || String(member.roleId) !== String(ownerRole._id)) {
      member.roleId = ownerRole._id;
      changed = true;
    }

    if (member.status !== "ACTIVE") {
      member.status = "ACTIVE";
      changed = true;
    }

    if (changed) {
      member.updatedBy = createdBy;
      await member.save();
      repairedMembers += 1;
    }
  }

  return {
    success: true,
    permissions: await getAllActiveSystemPermissions().then((items) => items.length),
    systemRoles: await Role.countDocuments({
      businessId: null,
      type: "SYSTEM",
    }),
    businessesChecked: businesses.length,
    repairedBusinesses,
    repairedMembers,
    businessOwnerRoleId: ownerRole._id,
  };
};

const createRole = async ({ name, slug, description = null, businessId, permissions = [], isDefault = false, createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "creator ID");

  const normalizedSlug = normalizeSlug(slug || name);

  if (!normalizedSlug) {
    throw new ApiError(400, "Role name or slug is required.");
  }

  const reservedSystemSlugs = new Set(SYSTEM_ROLE_DEFINITIONS.map((definition) => normalizeSlug(definition.slug)));
  if (reservedSystemSlugs.has(normalizedSlug)) {
    throw new ApiError(400, "This role slug is reserved for a system role.");
  }

  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  if (business.status !== "ACTIVE") {
    throw new ApiError(400, "Roles cannot be created for an inactive or suspended business.");
  }

  const existingRole = await Role.findOne({
    businessId,
    slug: normalizedSlug,
  }).select("_id");

  if (existingRole) {
    throw new ApiError(409, "A role with this slug already exists in this business.");
  }

  const permissionIds = [];

  if (Array.isArray(permissions) && permissions.length > 0) {
    for (const permissionId of permissions) {
      validateObjectId(permissionId, "permission ID");
      permissionIds.push(permissionId);
    }

    const activePermissionIds = await resolveRolePermissionIds(permissionIds, businessId);
    permissionIds.splice(0, permissionIds.length, ...activePermissionIds);
  }

  const role = await Role.create({
    name,
    slug: normalizedSlug,
    description,
    businessId,
    type: "CUSTOM",
    permissions: [...new Set(permissionIds.map(String))],
    isDefault: Boolean(isDefault),
    isActive: true,
    createdBy,
  });

  return getRoleById(role._id);
};

const getRolesByBusiness = async (businessId, { activeOnly = false } = {}) => {
  validateObjectId(businessId, "business ID");

  const filter = {
    businessId,
  };

  if (activeOnly) {
    filter.isActive = true;
  }

  return Role.find(filter).populate("permissions").sort({
    isDefault: -1,
    name: 1,
  });
};

const getAvailableRolesForBusiness = async (businessId, { activeOnly = true } = {}) => {
  validateObjectId(businessId, "business ID");

  const filter = {
    $or: [
      {
        businessId: null,
        type: "SYSTEM",
      },
      {
        businessId,
        type: "CUSTOM",
      },
    ],
  };

  if (activeOnly) {
    filter.isActive = true;
  }

  return Role.find(filter).populate("permissions").sort({
    type: 1,
    isDefault: -1,
    name: 1,
  });
};

const updateRole = async (roleId, updates, updatedBy, businessId = null) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(updatedBy, "updater ID");

  if (businessId !== null) {
    validateObjectId(businessId, "business ID");
  }

  const roleFilter = { _id: roleId };
  if (businessId !== null) roleFilter.businessId = businessId;
  const role = await Role.findOne(roleFilter);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  if (role.type === "SYSTEM") {
    throw new ApiError(400, "System roles cannot be modified.");
  }

  const allowedFields = ["name", "slug", "description", "permissions", "isDefault", "isActive"];

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    if (field === "slug") {
      const normalizedSlug = normalizeSlug(updates[field]);

      if (!normalizedSlug) {
        throw new ApiError(400, "Invalid role slug.");
      }

      const reservedSystemSlugs = new Set(SYSTEM_ROLE_DEFINITIONS.map((definition) => normalizeSlug(definition.slug)));
      if (reservedSystemSlugs.has(normalizedSlug)) {
        throw new ApiError(400, "This role slug is reserved for a system role.");
      }

      const duplicate = await Role.findOne({
        businessId: role.businessId,
        slug: normalizedSlug,
        _id: { $ne: role._id },
      }).select("_id");

      if (duplicate) {
        throw new ApiError(409, "A role with this slug already exists.");
      }

      role.slug = normalizedSlug;
      continue;
    }

    if (field === "permissions") {
      if (!Array.isArray(updates[field])) {
        throw new ApiError(400, "Permissions must be an array.");
      }

      const permissionIds = [...new Set(updates[field].map(String))];

      for (const permissionId of permissionIds) {
        validateObjectId(permissionId, "permission ID");
      }

      role.permissions = await resolveRolePermissionIds(permissionIds, role.businessId, { dropInactive: true });
      continue;
    }

    role[field] = updates[field];
  }

  role.updatedBy = updatedBy;

  await role.save();

  return getRoleById(role._id);
};

const deleteRole = async (roleId, deletedBy, businessId = null) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(deletedBy, "deleter ID");

  if (businessId !== null) {
    validateObjectId(businessId, "business ID");
  }

  const roleFilter = { _id: roleId };
  if (businessId !== null) roleFilter.businessId = businessId;
  const role = await Role.findOne(roleFilter);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  if (role.type === "SYSTEM") {
    throw new ApiError(400, "System roles cannot be deleted.");
  }

  const assignedMember = await BusinessMember.exists({
    businessId: role.businessId,
    roleId: role._id,
  });

  if (assignedMember) {
    throw new ApiError(400, "This role is assigned to one or more business members and cannot be deleted.");
  }

  await Role.deleteOne({
    _id: role._id,
    businessId: role.businessId,
  });

  return role;
};

const assignPermissions = async (roleId, permissionIds, updatedBy) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(updatedBy, "updater ID");

  if (!Array.isArray(permissionIds)) {
    throw new ApiError(400, "Permissions must be an array.");
  }

  const role = await Role.findById(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  if (!role.isActive) {
    throw new ApiError(400, "Cannot assign permissions to an inactive role.");
  }

  const uniquePermissionIds = [...new Set(permissionIds.map(String))];

  for (const permissionId of uniquePermissionIds) {
    validateObjectId(permissionId, "permission ID");
  }

  role.permissions = await resolveRolePermissionIds(uniquePermissionIds, role.businessId);
  role.updatedBy = updatedBy;

  await role.save();

  return getRoleById(role._id);
};

const addPermissionsToRole = async (roleId, permissionIds, updatedBy) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(updatedBy, "updater ID");

  if (!Array.isArray(permissionIds)) {
    throw new ApiError(400, "Permissions must be an array.");
  }

  const role = await Role.findById(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  const uniquePermissionIds = [...new Set(permissionIds.map(String))];

  for (const permissionId of uniquePermissionIds) {
    validateObjectId(permissionId, "permission ID");
  }

  const activePermissionIds = await resolveRolePermissionIds(uniquePermissionIds, role.businessId);
  const currentIds = new Set((role.permissions || []).map(String));

  for (const permissionId of activePermissionIds) {
    currentIds.add(permissionId);
  }

  role.permissions = [...currentIds];
  role.updatedBy = updatedBy;

  await role.save();

  return getRoleById(role._id);
};

const removePermissionsFromRole = async (roleId, permissionIds, updatedBy) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(updatedBy, "updater ID");

  if (!Array.isArray(permissionIds)) {
    throw new ApiError(400, "Permissions must be an array.");
  }

  const role = await Role.findById(roleId);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  if (role.type === "SYSTEM" && role.slug === "business-owner") {
    throw new ApiError(400, "Business Owner permissions cannot be manually removed.");
  }

  const removeIds = new Set(permissionIds.map(String));

  role.permissions = (role.permissions || []).filter((permissionId) => !removeIds.has(String(permissionId)));

  role.updatedBy = updatedBy;

  await role.save();

  return getRoleById(role._id);
};

module.exports = {
  validateObjectId,

  normalizeSlug,

  getRoleById,
  getRoleBySlug,

  ensureSystemPermissions,
  getAllActiveSystemPermissions,

  ensureSystemRole,
  ensureSystemRoles,

  getBusinessOwnerRole,

  repairAccessControl,

  createRole,
  getRolesByBusiness,
  getAvailableRolesForBusiness,

  updateRole,
  deleteRole,

  assignPermissions,
  addPermissionsToRole,
  removePermissionsFromRole,
};
