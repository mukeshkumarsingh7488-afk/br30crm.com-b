const mongoose = require("mongoose");
const File = require("./file.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateBusiness = async (businessId) => {
  if (!isValidObjectId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }

  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  if (business.status && business.status !== "ACTIVE") {
    throw new ApiError(400, "Business is not active");
  }

  return business;
};

const validateMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).select("_id");

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return member;
};

const createFile = async ({ businessId, userId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!data.originalName) {
    throw new ApiError(400, "Original file name is required");
  }

  if (!data.fileName) {
    throw new ApiError(400, "File name is required");
  }

  if (!data.mimeType) {
    throw new ApiError(400, "MIME type is required");
  }

  if (data.size === undefined || data.size === null || Number(data.size) < 0) {
    throw new ApiError(400, "Valid file size is required");
  }

  if (!data.storageKey) {
    throw new ApiError(400, "Storage key is required");
  }

  if (!data.url) {
    throw new ApiError(400, "File URL is required");
  }

  if (data.entityId && !isValidObjectId(data.entityId)) {
    throw new ApiError(400, "Invalid entity ID");
  }

  const file = await File.create({
    businessId,
    uploadedBy: userId,
    originalName: data.originalName,
    fileName: data.fileName,
    mimeType: data.mimeType,
    extension: data.extension || "",
    size: Number(data.size),
    storageProvider: data.storageProvider || "LOCAL",
    storageKey: data.storageKey,
    url: data.url,
    folder: data.folder || "",
    visibility: data.visibility || "PRIVATE",
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    description: data.description || "",
    metadata: data.metadata || {},
    status: "ACTIVE",
  });

  return file;
};

const getFiles = async ({ businessId, userId, folder, entityType, entityId, uploadedBy, mimeType, visibility, page = 1, limit = 20 }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
    status: "ACTIVE",
  };

  if (folder !== undefined) {
    filter.folder = folder;
  }

  if (entityType) {
    filter.entityType = entityType;
  }

  if (entityId) {
    if (!isValidObjectId(entityId)) {
      throw new ApiError(400, "Invalid entity ID");
    }

    filter.entityId = entityId;
  }

  if (uploadedBy) {
    if (!isValidObjectId(uploadedBy)) {
      throw new ApiError(400, "Invalid uploadedBy ID");
    }

    filter.uploadedBy = uploadedBy;
  }

  if (mimeType) {
    filter.mimeType = mimeType;
  }

  if (visibility) {
    filter.visibility = visibility;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [files, total] = await Promise.all([File.find(filter).populate("uploadedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean(), File.countDocuments(filter)]);

  return {
    files,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const getFileById = async ({ businessId, userId, fileId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const file = await File.findOne({
    _id: fileId,
    businessId,
    status: "ACTIVE",
  }).populate("uploadedBy", "name email");

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  return file;
};

const updateFile = async ({ businessId, userId, fileId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const file = await File.findOne({
    _id: fileId,
    businessId,
    status: "ACTIVE",
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  if (data.folder !== undefined) {
    file.folder = data.folder;
  }

  if (data.visibility !== undefined) {
    file.visibility = data.visibility;
  }

  if (data.description !== undefined) {
    file.description = data.description;
  }

  if (data.entityType !== undefined) {
    file.entityType = data.entityType || null;
  }

  if (data.entityId !== undefined) {
    if (data.entityId && !isValidObjectId(data.entityId)) {
      throw new ApiError(400, "Invalid entity ID");
    }

    file.entityId = data.entityId || null;
  }

  if (data.metadata !== undefined) {
    file.metadata = data.metadata;
  }

  await file.save();

  return file;
};

const deleteFile = async ({ businessId, userId, fileId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const file = await File.findOne({
    _id: fileId,
    businessId,
    status: "ACTIVE",
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  file.status = "DELETED";
  file.deletedAt = new Date();
  file.deletedBy = userId;

  await file.save();

  return file;
};

const restoreFile = async ({ businessId, userId, fileId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const file = await File.findOne({
    _id: fileId,
    businessId,
    status: "DELETED",
  });

  if (!file) {
    throw new ApiError(404, "Deleted file not found");
  }

  file.status = "ACTIVE";
  file.deletedAt = null;
  file.deletedBy = null;

  await file.save();

  return file;
};

module.exports = {
  createFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  restoreFile,
};
