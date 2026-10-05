const Integration = require("./integration.model");
const Business = require("../businesses/business.model");

const ApiError = require("../../utils/ApiError");

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id.toString())) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const getBusiness = async (businessId) => {
  validateObjectId(businessId, "business ID");

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  return business;
};

const sanitizeCredentials = (credentials) => {
  if (!credentials || typeof credentials !== "object") {
    return {};
  }

  return credentials;
};

const sanitizeIntegration = (integration) => {
  if (!integration) {
    return integration;
  }

  const result = {
    ...integration,
  };

  delete result.credentials;

  return result;
};

const createIntegration = async ({ businessId, name, provider, type, status, config, credentials, metadata, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  const integration = await Integration.create({
    businessId,
    name: name.trim(),
    provider: provider.trim().toLowerCase(),
    type,
    status: status || "INACTIVE",
    config: config && typeof config === "object" ? config : {},
    credentials: sanitizeCredentials(credentials),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
    createdBy,
    lastConnectedAt: status === "ACTIVE" ? new Date() : null,
  });

  const result = await Integration.findOne({
    _id: integration._id,
    businessId,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  return sanitizeIntegration(result);
};

const getIntegrationsByBusiness = async (businessId, { page = 1, limit = 10, search, provider, type, status } = {}) => {
  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

  if (provider) {
    filter.provider = provider.trim().toLowerCase();
  }

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchValue = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        provider: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [integrations, total] = await Promise.all([Integration.find(filter).select("-credentials").populate("createdBy", "name email").populate("updatedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Integration.countDocuments(filter)]);

  return {
    integrations: integrations.map(sanitizeIntegration),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getIntegrationById = async (integrationId, businessId) => {
  validateObjectId(integrationId, "integration ID");

  await getBusiness(businessId);

  const integration = await Integration.findOne({
    _id: integrationId,
    businessId,
  })
    .select("-credentials")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!integration) {
    throw new ApiError(404, "Integration not found.");
  }

  return sanitizeIntegration(integration);
};

const updateIntegration = async (integrationId, businessId, updates, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(integrationId, "integration ID");
  validateObjectId(updatedBy, "updated by user ID");

  const integration = await Integration.findOne({
    _id: integrationId,
    businessId,
  });

  if (!integration) {
    throw new ApiError(404, "Integration not found.");
  }

  if (updates.name !== undefined) {
    integration.name = updates.name.trim();
  }

  if (updates.provider !== undefined) {
    integration.provider = updates.provider.trim().toLowerCase();
  }

  if (updates.type !== undefined) {
    integration.type = updates.type;
  }

  if (updates.status !== undefined) {
    integration.status = updates.status;

    if (updates.status === "ACTIVE") {
      integration.lastConnectedAt = new Date();
      integration.errorMessage = null;
    }

    if (updates.status === "ERROR") {
      integration.errorMessage = updates.errorMessage || integration.errorMessage;
    }

    if (updates.status === "DISCONNECTED") {
      integration.errorMessage = null;
    }
  }

  if (updates.config !== undefined) {
    integration.config = updates.config && typeof updates.config === "object" ? updates.config : {};
  }

  if (updates.credentials !== undefined) {
    integration.credentials = sanitizeCredentials(updates.credentials);
  }

  if (updates.metadata !== undefined) {
    integration.metadata = updates.metadata && typeof updates.metadata === "object" ? updates.metadata : {};
  }

  if (updates.errorMessage !== undefined) {
    integration.errorMessage = updates.errorMessage || null;
  }

  integration.updatedBy = updatedBy;

  await integration.save();

  return getIntegrationById(integrationId, businessId);
};

const deleteIntegration = async (integrationId, businessId, deletedBy) => {
  await getBusiness(businessId);

  validateObjectId(integrationId, "integration ID");
  validateObjectId(deletedBy, "deleted by user ID");

  const integration = await Integration.findOne({
    _id: integrationId,
    businessId,
  });

  if (!integration) {
    throw new ApiError(404, "Integration not found.");
  }

  await Integration.findByIdAndDelete(integrationId);

  return {
    id: integrationId,
    deleted: true,
  };
};

const updateIntegrationStatus = async (integrationId, businessId, status, errorMessage, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(integrationId, "integration ID");
  validateObjectId(updatedBy, "updated by user ID");

  const integration = await Integration.findOne({
    _id: integrationId,
    businessId,
  });

  if (!integration) {
    throw new ApiError(404, "Integration not found.");
  }

  integration.status = status;
  integration.updatedBy = updatedBy;

  if (status === "ACTIVE") {
    integration.lastConnectedAt = new Date();
    integration.errorMessage = null;
  }

  if (status === "ERROR") {
    integration.errorMessage = errorMessage || null;
  }

  if (status !== "ERROR") {
    integration.errorMessage = null;
  }

  await integration.save();

  return getIntegrationById(integrationId, businessId);
};

module.exports = {
  createIntegration,
  getIntegrationsByBusiness,
  getIntegrationById,
  updateIntegration,
  deleteIntegration,
  updateIntegrationStatus,
};
