const mongoose = require("mongoose");

const AuditLog = require("./audit.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");

const SENSITIVE_KEYS = new Set(["password", "currentPassword", "newPassword", "confirmPassword", "token", "accessToken", "refreshToken", "idToken", "authorization", "cookie", "apiKey", "secret", "secretHash", "credentials", "clientSecret", "privateKey"]);

const sanitizeAuditData = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditData(item));
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const result = {};

  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = "[REDACTED]";
      continue;
    }

    result[key] = sanitizeAuditData(item);
  }

  return result;
};

const validateBusiness = async (businessId) => {
  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  return business;
};

const validateBusinessMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  })
    .populate("roleId", "name type")
    .lean();

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return member;
};

const createAuditLog = async ({ businessId, actorId = null, action, module, entityType = null, entityId = null, description = "", severity = "INFO", status = "SUCCESS", before = null, after = null, metadata = {}, ipAddress = null, userAgent = null, requestId = null }) => {
  await validateBusiness(businessId);

  const auditLog = await AuditLog.create({
    businessId,
    actorId,
    action,
    module,
    entityType,
    entityId,
    description,
    severity,
    status,
    before: sanitizeAuditData(before),
    after: sanitizeAuditData(after),
    metadata: sanitizeAuditData(metadata),
    ipAddress,
    userAgent,
    requestId,
  });

  return auditLog;
};

const getAuditLogs = async (businessId, userId, filters = {}) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const { actorId, action, module, entityType, entityId, severity, status, startDate, endDate, page = 1, limit = 20 } = filters;

  const query = {
    businessId,
  };

  if (actorId) {
    query.actorId = actorId;
  }

  if (action) {
    query.action = action;
  }

  if (module) {
    query.module = module;
  }

  if (entityType) {
    query.entityType = entityType;
  }

  if (entityId) {
    query.entityId = entityId;
  }

  if (severity) {
    query.severity = severity;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([AuditLog.find(query).populate("actorId", "name email").sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(), AuditLog.countDocuments(query)]);

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getAuditLogById = async (businessId, userId, auditId) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const auditLog = await AuditLog.findOne({
    _id: auditId,
    businessId,
  })
    .populate("actorId", "name email")
    .lean();

  if (!auditLog) {
    throw new ApiError(404, "Audit log not found");
  }

  return auditLog;
};

const getEntityAuditLogs = async (businessId, userId, entityType, entityId, filters = {}) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const { page = 1, limit = 20 } = filters;

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const query = {
    businessId,
    entityType,
    entityId,
  };

  const [logs, total] = await Promise.all([AuditLog.find(query).populate("actorId", "name email").sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(), AuditLog.countDocuments(query)]);

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
};
