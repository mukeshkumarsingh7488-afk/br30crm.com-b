const fileService = require("./file.service");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

const createFile = asyncHandler(async (req, res) => {
  const file = await fileService.createFile({
    businessId: req.params.businessId,
    userId: req.user.userId,
    data: req.body,
  });

  return res.status(201).json(new ApiResponse(201, file, "File created successfully"));
});

const getFiles = asyncHandler(async (req, res) => {
  const result = await fileService.getFiles({
    businessId: req.params.businessId,
    userId: req.user.userId,
    folder: req.query.folder,
    entityType: req.query.entityType,
    entityId: req.query.entityId,
    uploadedBy: req.query.uploadedBy,
    mimeType: req.query.mimeType,
    visibility: req.query.visibility,
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json(new ApiResponse(200, result, "Files fetched successfully"));
});

const getFileById = asyncHandler(async (req, res) => {
  const file = await fileService.getFileById({
    businessId: req.params.businessId,
    userId: req.user.userId,
    fileId: req.params.fileId,
  });

  return res.status(200).json(new ApiResponse(200, file, "File fetched successfully"));
});

const updateFile = asyncHandler(async (req, res) => {
  const file = await fileService.updateFile({
    businessId: req.params.businessId,
    userId: req.user.userId,
    fileId: req.params.fileId,
    data: req.body,
  });

  return res.status(200).json(new ApiResponse(200, file, "File updated successfully"));
});

const deleteFile = asyncHandler(async (req, res) => {
  const file = await fileService.deleteFile({
    businessId: req.params.businessId,
    userId: req.user.userId,
    fileId: req.params.fileId,
  });

  return res.status(200).json(new ApiResponse(200, file, "File deleted successfully"));
});

const restoreFile = asyncHandler(async (req, res) => {
  const file = await fileService.restoreFile({
    businessId: req.params.businessId,
    userId: req.user.userId,
    fileId: req.params.fileId,
  });

  return res.status(200).json(new ApiResponse(200, file, "File restored successfully"));
});

module.exports = {
  createFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  restoreFile,
};
