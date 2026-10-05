const crypto = require("crypto");

const ApiKey = require("./api-key.model");
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

const generateApiKey = () => {
  const randomPart = crypto.randomBytes(32).toString("hex");

  return `br30_live_${randomPart}`;
};

const hashApiKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

const createApiKey = async ({ businessId, name, expiresAt, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  let parsedExpiresAt = null;

  if (expiresAt) {
    parsedExpiresAt = new Date(expiresAt);

    if (Number.isNaN(parsedExpiresAt.getTime())) {
      throw new ApiError(400, "Invalid expiration date.");
    }

    if (parsedExpiresAt <= new Date()) {
      throw new ApiError(400, "Expiration date must be in the future.");
    }
  }

  const apiKey = generateApiKey();

  const keyHash = hashApiKey(apiKey);

  const keyPrefix = apiKey.substring(0, 17);

  const created = await ApiKey.create({
    businessId,
    name: name.trim(),
    keyPrefix,
    keyHash,
    status: "ACTIVE",
    expiresAt: parsedExpiresAt,
    createdBy,
  });

  const result = await ApiKey.findOne({
    _id: created._id,
    businessId,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  return {
    apiKey,
    apiKeyData: result,
  };
};

const getApiKeysByBusiness = async (businessId, { page = 1, limit = 10, search, status } = {}) => {
  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

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
        keyPrefix: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [apiKeys, total] = await Promise.all([ApiKey.find(filter).select("-keyHash").populate("createdBy", "name email").populate("updatedBy", "name email").populate("revokedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), ApiKey.countDocuments(filter)]);

  return {
    apiKeys,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getApiKeyById = async (apiKeyId, businessId) => {
  validateObjectId(apiKeyId, "API key ID");
  await getBusiness(businessId);

  const apiKey = await ApiKey.findOne({
    _id: apiKeyId,
    businessId,
  })
    .select("-keyHash")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("revokedBy", "name email")
    .lean();

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  return apiKey;
};

const updateApiKey = async (apiKeyId, businessId, updates, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(apiKeyId, "API key ID");
  validateObjectId(updatedBy, "updated by user ID");

  const apiKey = await ApiKey.findOne({
    _id: apiKeyId,
    businessId,
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  if (updates.name !== undefined) {
    apiKey.name = updates.name.trim();
  }

  if (updates.expiresAt !== undefined) {
    if (updates.expiresAt === null) {
      apiKey.expiresAt = null;
    } else {
      const parsedExpiresAt = new Date(updates.expiresAt);

      if (Number.isNaN(parsedExpiresAt.getTime())) {
        throw new ApiError(400, "Invalid expiration date.");
      }

      if (parsedExpiresAt <= new Date()) {
        throw new ApiError(400, "Expiration date must be in the future.");
      }

      apiKey.expiresAt = parsedExpiresAt;
    }
  }

  if (updates.status !== undefined) {
    if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(updates.status)) {
      throw new ApiError(400, "Invalid API key status.");
    }

    if (updates.status === "REVOKED" && apiKey.status !== "REVOKED") {
      apiKey.revokedAt = new Date();
      apiKey.revokedBy = updatedBy;
    }

    if (updates.status !== "REVOKED" && apiKey.status === "REVOKED") {
      throw new ApiError(400, "A revoked API key cannot be activated or reactivated.");
    }

    apiKey.status = updates.status;
  }

  apiKey.updatedBy = updatedBy;

  await apiKey.save();

  return getApiKeyById(apiKeyId, businessId);
};

const deleteApiKey = async (apiKeyId, businessId, deletedBy) => {
  await getBusiness(businessId);

  validateObjectId(apiKeyId, "API key ID");
  validateObjectId(deletedBy, "deleted by user ID");

  const apiKey = await ApiKey.findOne({
    _id: apiKeyId,
    businessId,
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  await ApiKey.findByIdAndDelete(apiKeyId);

  return {
    id: apiKeyId,
    deleted: true,
  };
};

module.exports = {
  createApiKey,
  getApiKeysByBusiness,
  getApiKeyById,
  updateApiKey,
  deleteApiKey,
  hashApiKey,
};
