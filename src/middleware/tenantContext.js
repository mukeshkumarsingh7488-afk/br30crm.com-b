const ApiError = require("../utils/ApiError");

const tenantContext = (req, res, next) => {
  const businessId = req.params?.businessId || req.business?.id || req.body?.businessId || req.query?.businessId || req.headers["x-business-id"];

  if (businessId) {
    req.tenantId = String(businessId);
  }

  next();
};

const requireTenantContext = (req, res, next) => {
  if (!req.tenantId && !req.isMasterAdmin) {
    return next(new ApiError(400, "Business tenant context is required."));
  }
  next();
};

module.exports = { tenantContext, requireTenantContext };
