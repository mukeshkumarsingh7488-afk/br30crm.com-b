const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const Note = require("./note.model");

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const getNoteById = async (noteId, businessId) => {
  validateObjectId(noteId, "note ID");
  validateObjectId(businessId, "business ID");

  const note = await Note.findOne({
    _id: noteId,
    businessId,
    isDeleted: false,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("contactId")
    .populate("companyId")
    .populate("leadId")
    .populate("dealId")
    .populate("tags");

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  return note;
};

const createNote = async ({ businessId, title, content, createdBy, contactId, companyId, leadId, dealId, tags, isPinned }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "creator ID");

  if (contactId) {
    validateObjectId(contactId, "contact ID");
  }

  if (companyId) {
    validateObjectId(companyId, "company ID");
  }

  if (leadId) {
    validateObjectId(leadId, "lead ID");
  }

  if (dealId) {
    validateObjectId(dealId, "deal ID");
  }

  if (Array.isArray(tags)) {
    tags.forEach((tagId) => validateObjectId(tagId, "tag ID"));
  }

  const note = await Note.create({
    businessId,
    title,
    content,
    createdBy,
    contactId: contactId || null,
    companyId: companyId || null,
    leadId: leadId || null,
    dealId: dealId || null,
    tags: tags || [],
    isPinned: Boolean(isPinned),
  });

  return getNoteById(note._id, businessId);
};

const getNotesByBusiness = async (businessId, { page = 1, limit = 20, search, contactId, companyId, leadId, dealId, createdBy, isPinned, isArchived = false } = {}) => {
  validateObjectId(businessId, "business ID");

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
    isDeleted: false,
    isArchived: Boolean(isArchived),
  };

  if (contactId) {
    validateObjectId(contactId, "contact ID");
    filter.contactId = contactId;
  }

  if (companyId) {
    validateObjectId(companyId, "company ID");
    filter.companyId = companyId;
  }

  if (leadId) {
    validateObjectId(leadId, "lead ID");
    filter.leadId = leadId;
  }

  if (dealId) {
    validateObjectId(dealId, "deal ID");
    filter.dealId = dealId;
  }

  if (createdBy) {
    validateObjectId(createdBy, "creator ID");
    filter.createdBy = createdBy;
  }

  if (isPinned !== undefined && isPinned !== "") {
    filter.isPinned = Boolean(isPinned);
  }

  if (search && search.trim()) {
    const searchText = search.trim();

    filter.$or = [
      {
        title: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        content: {
          $regex: searchText,
          $options: "i",
        },
      },
    ];
  }

  const skip = (currentPage - 1) * currentLimit;

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("contactId")
      .populate("companyId")
      .populate("leadId")
      .populate("dealId")
      .populate("tags")
      .sort({
        isPinned: -1,
        updatedAt: -1,
      })
      .skip(skip)
      .limit(currentLimit),

    Note.countDocuments(filter),
  ]);

  return {
    notes,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

const updateNote = async (noteId, businessId, updates, updatedBy) => {
  validateObjectId(noteId, "note ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const note = await Note.findOne({
    _id: noteId,
    businessId,
    isDeleted: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  const allowedFields = ["title", "content", "contactId", "companyId", "leadId", "dealId", "tags", "isPinned", "isArchived"];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      note[field] = updates[field];
    }
  }

  if (updates.contactId) {
    validateObjectId(updates.contactId, "contact ID");
  }

  if (updates.companyId) {
    validateObjectId(updates.companyId, "company ID");
  }

  if (updates.leadId) {
    validateObjectId(updates.leadId, "lead ID");
  }

  if (updates.dealId) {
    validateObjectId(updates.dealId, "deal ID");
  }

  if (Array.isArray(updates.tags)) {
    updates.tags.forEach((tagId) => {
      validateObjectId(tagId, "tag ID");
    });
  }

  note.updatedBy = updatedBy;

  await note.save();

  return getNoteById(note._id, businessId);
};

const togglePinNote = async (noteId, businessId, updatedBy) => {
  validateObjectId(noteId, "note ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const note = await Note.findOne({
    _id: noteId,
    businessId,
    isDeleted: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  note.isPinned = !note.isPinned;
  note.updatedBy = updatedBy;

  await note.save();

  return getNoteById(note._id, businessId);
};

const archiveNote = async (noteId, businessId, updatedBy) => {
  validateObjectId(noteId, "note ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const note = await Note.findOne({
    _id: noteId,
    businessId,
    isDeleted: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  note.isArchived = !note.isArchived;
  note.updatedBy = updatedBy;

  await note.save();

  return getNoteById(note._id, businessId);
};

const deleteNote = async (noteId, businessId, deletedBy) => {
  validateObjectId(noteId, "note ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(deletedBy, "deleter ID");

  const note = await Note.findOne({
    _id: noteId,
    businessId,
    isDeleted: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  note.isDeleted = true;
  note.deletedAt = new Date();
  note.deletedBy = deletedBy;

  await note.save();

  return note;
};

module.exports = {
  validateObjectId,
  getNoteById,
  createNote,
  getNotesByBusiness,
  updateNote,
  togglePinNote,
  archiveNote,
  deleteNote,
};
