const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const auditService = require("./audit.service");

const getAuditLogs = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const result = await auditService.getAuditLogs(businessId, req.user.userId, req.query);

  return ApiResponse.success(res, result, "Audit logs fetched successfully");
});

const getAuditLogById = asyncHandler(async (req, res) => {
  const { businessId, auditId } = req.params;

  const auditLog = await auditService.getAuditLogById(businessId, req.user.userId, auditId);

  return ApiResponse.success(res, auditLog, "Audit log fetched successfully");
});

const getEntityAuditLogs = asyncHandler(async (req, res) => {
  const { businessId, entityType, entityId } = req.params;

  const result = await auditService.getEntityAuditLogs(businessId, req.user.userId, entityType, entityId, req.query);

  return ApiResponse.success(res, result, "Entity audit logs fetched successfully");
});

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
};
