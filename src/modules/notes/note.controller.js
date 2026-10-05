const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const noteService = require("./note.service");

const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { note }, "Note created successfully.");
});

const getNotesByBusiness = asyncHandler(async (req, res) => {
  const result = await noteService.getNotesByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    contactId: req.query.contactId,
    companyId: req.query.companyId,
    leadId: req.query.leadId,
    dealId: req.query.dealId,
    createdBy: req.query.createdBy,
    isPinned: req.query.isPinned,
    isArchived: req.query.isArchived,
  });

  return ApiResponse.success(res, result, "Notes fetched successfully.");
});

const getNoteById = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.params.noteId, req.params.businessId);

  return ApiResponse.success(res, { note }, "Note fetched successfully.");
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.params.noteId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { note }, "Note updated successfully.");
});

const togglePinNote = asyncHandler(async (req, res) => {
  const note = await noteService.togglePinNote(req.params.noteId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { note }, "Note pin status updated successfully.");
});

const archiveNote = asyncHandler(async (req, res) => {
  const note = await noteService.archiveNote(req.params.noteId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { note }, "Note archive status updated successfully.");
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await noteService.deleteNote(req.params.noteId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, { note }, "Note deleted successfully.");
});

module.exports = {
  createNote,
  getNotesByBusiness,
  getNoteById,
  updateNote,
  togglePinNote,
  archiveNote,
  deleteNote,
};
