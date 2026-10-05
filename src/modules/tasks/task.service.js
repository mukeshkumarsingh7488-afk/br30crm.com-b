const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const { resolveRecordAccess, applyRecordVisibility, assertRecordAccess } = require("../../utils/recordAccess");

const Task = require("./task.model");

const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const Tag = require("../tags/tag.model");
const BusinessMember = require("../business-members/business-member.model");

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getActiveAssignedUser = async (assignedTo, businessId) => {
  if (!assignedTo) {
    return null;
  }

  validateObjectId(assignedTo, "assigned user ID");

  const member = await BusinessMember.findOne({
    businessId,
    userId: assignedTo,
    status: "ACTIVE",
  }).select("_id userId businessId status");

  if (!member) {
    throw new ApiError(400, "Assigned user is not an active member of this business.");
  }

  return member;
};

const getRelatedRecord = async (relatedTo, businessId) => {
  if (!relatedTo) {
    return null;
  }

  if (!relatedTo.type && !relatedTo.id) {
    return null;
  }

  if (!relatedTo.type || !relatedTo.id) {
    throw new ApiError(400, "Related record type and ID are both required.");
  }

  const allowedTypes = ["LEAD", "CONTACT", "COMPANY", "DEAL"];

  if (!allowedTypes.includes(relatedTo.type)) {
    throw new ApiError(400, "Invalid related record type.");
  }

  validateObjectId(relatedTo.id, "related record ID");

  let record = null;

  if (relatedTo.type === "LEAD") {
    record = await Lead.findOne({
      _id: relatedTo.id,
      businessId,
    }).select("_id businessId status");
  }

  if (relatedTo.type === "CONTACT") {
    record = await Contact.findOne({
      _id: relatedTo.id,
      businessId,
      status: "ACTIVE",
    }).select("_id businessId status");
  }

  if (relatedTo.type === "COMPANY") {
    record = await Company.findOne({
      _id: relatedTo.id,
      businessId,
      status: "ACTIVE",
    }).select("_id businessId status");
  }

  if (relatedTo.type === "DEAL") {
    record = await Deal.findOne({
      _id: relatedTo.id,
      businessId,
      isActive: true,
    }).select("_id businessId status isActive");
  }

  if (!record) {
    throw new ApiError(400, `Related ${relatedTo.type.toLowerCase()} not found, inactive, or does not belong to this business.`);
  }

  return record;
};

const getBusinessTags = async (tags, businessId) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  if (!Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array.");
  }

  const uniqueTags = [...new Set(tags.map((tag) => String(tag)))];

  uniqueTags.forEach((tagId) => {
    validateObjectId(tagId, "tag ID");
  });

  const tagDocuments = await Tag.find({
    _id: {
      $in: uniqueTags,
    },
    businessId,
    isDeleted: false,
  }).select("_id businessId");

  if (tagDocuments.length !== uniqueTags.length) {
    throw new ApiError(400, "One or more tags are invalid or do not belong to this business.");
  }

  return tagDocuments.map((tag) => tag._id);
};

const validateTaskRelationships = async ({ businessId, assignedTo, relatedTo, tags }) => {
  await Promise.all([getActiveAssignedUser(assignedTo, businessId), getRelatedRecord(relatedTo, businessId)]);

  return getBusinessTags(tags, businessId);
};


const assertTaskAccess = (task, access = {}) => {
  if (access?.fullAccess || access?.isBusinessOwner) return;
  validateObjectId(access.userId, "user ID");
  const assignedUserId = task?.assignedTo?._id || task?.assignedTo;
  if (!assignedUserId || String(assignedUserId) !== String(access.userId)) throw new ApiError(403, "You do not have access to this task.");
};

const getTaskById = async (taskId, businessId, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  })
    .populate("assignedTo", "name email phone")
    .populate("createdBy", "name email")
    .populate("tags");

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  if (task.relatedTo?.type && task.relatedTo?.id) {
    const relatedId = task.relatedTo.id.toString();

    if (task.relatedTo.type === "LEAD") {
      const lead = await Lead.findOne({
        _id: relatedId,
        businessId,
      }).select("name firstName lastName email phone status");

      task.relatedTo = {
        type: task.relatedTo.type,
        id: lead || task.relatedTo.id,
        _id: task.relatedTo._id,
      };
    }

    if (task.relatedTo.type === "CONTACT") {
      const contact = await Contact.findOne({
        _id: relatedId,
        businessId,
      }).select("firstName lastName email phone companyId status");

      task.relatedTo = {
        type: task.relatedTo.type,
        id: contact || task.relatedTo.id,
        _id: task.relatedTo._id,
      };
    }

    if (task.relatedTo.type === "COMPANY") {
      const company = await Company.findOne({
        _id: relatedId,
        businessId,
      }).select("name legalName email phone website industry status");

      task.relatedTo = {
        type: task.relatedTo.type,
        id: company || task.relatedTo.id,
        _id: task.relatedTo._id,
      };
    }

    if (task.relatedTo.type === "DEAL") {
      const deal = await Deal.findOne({
        _id: relatedId,
        businessId,
      }).select("name value currency status pipelineId stageId");

      task.relatedTo = {
        type: task.relatedTo.type,
        id: deal || task.relatedTo.id,
        _id: task.relatedTo._id,
      };
    }
  }

  return task;
};

const createTask = async ({ businessId, title, description, status, priority, dueDate, assignedTo, createdBy, relatedTo, tags }) => {
  validateObjectId(businessId, "business ID");

  validateObjectId(createdBy, "creator ID");

  const validatedTags = await validateTaskRelationships({
    businessId,
    assignedTo,
    relatedTo,
    tags,
  });

  const task = await Task.create({
    businessId,
    title,
    description: description || null,
    status: status || "TODO",
    priority: priority || "MEDIUM",
    dueDate: dueDate || null,
    assignedTo: assignedTo || null,
    createdBy,
    relatedTo: relatedTo || {
      type: null,
      id: null,
    },
    tags: validatedTags,
    isActive: true,
    deletedAt: null,
    deletedBy: null,
  });

  return getTaskById(task._id, businessId);
};

const getTasksByBusiness = async (businessId, { page = 1, limit = 20, status, priority, assignedTo, search, sortBy = "createdAt", sortOrder = "desc", access = null } = {}) => {
  validateObjectId(businessId, "business ID");

  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
    isActive: true,
  };

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    if (!recordAccess.fullAccess) {
      applyRecordVisibility(filter, recordAccess, { assignedTeamField: null });
    }
    access = { ...access, fullAccess: recordAccess.fullAccess, teamIds: recordAccess.teamIds };
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (assignedTo) {
    validateObjectId(assignedTo, "assigned user ID");

    if (access && !access.fullAccess && !access.isBusinessOwner && String(assignedTo) !== String(access.userId)) {
      throw new ApiError(403, "You can only view tasks assigned to you.");
    }

    filter.assignedTo = assignedTo;
  }

  if (typeof search === "string" && search.trim()) {
    const safeSearch = escapeRegex(search.trim());

    filter.$or = [
      {
        title: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const allowedSortFields = ["createdAt", "updatedAt", "dueDate", "priority", "status", "title"];

  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const sort = {
    [safeSortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const skip = (currentPage - 1) * currentLimit;

  const [tasks, total] = await Promise.all([Task.find(filter).populate("assignedTo", "name email phone").populate("createdBy", "name email").populate("tags").sort(sort).skip(skip).limit(currentLimit), Task.countDocuments(filter)]);

  return {
    tasks,

    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

const updateTask = async (taskId, businessId, updates, updatedBy, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(updatedBy, "updater ID");

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  const hasRelationshipUpdate = Object.prototype.hasOwnProperty.call(updates, "relatedTo") || Object.prototype.hasOwnProperty.call(updates, "tags");

  if (hasRelationshipUpdate) {
    await validateTaskRelationships({
      businessId,

      assignedTo: task.assignedTo,

      relatedTo: Object.prototype.hasOwnProperty.call(updates, "relatedTo") ? updates.relatedTo : task.relatedTo,

      tags: Object.prototype.hasOwnProperty.call(updates, "tags") ? updates.tags : task.tags,
    });
  }

  const allowedFields = ["title", "description", "status", "priority", "dueDate", "relatedTo", "tags"];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      task[field] = updates[field];
    }
  }

  if (updates.status === "COMPLETED") {
    task.completedAt = task.completedAt || new Date();
  } else if (updates.status && updates.status !== "COMPLETED") {
    task.completedAt = null;
  }

  await task.save();

  return getTaskById(task._id, businessId);
};

const deleteTask = async (taskId, businessId, deletedBy, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(deletedBy, "deleter ID");

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  task.isActive = false;
  task.deletedAt = new Date();
  task.deletedBy = deletedBy;

  await task.save();

  return task;
};

const assignTask = async (taskId, businessId, assignedTo, updatedBy, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(assignedTo, "assigned user ID");

  validateObjectId(updatedBy, "updater ID");

  await getActiveAssignedUser(assignedTo, businessId);

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  task.assignedTo = assignedTo;

  await task.save();

  return getTaskById(task._id, businessId);
};

const unassignTask = async (taskId, businessId, updatedBy, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(updatedBy, "updater ID");

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  task.assignedTo = null;

  await task.save();

  return getTaskById(task._id, businessId);
};

const completeTask = async (taskId, businessId, updatedBy, access = null) => {
  validateObjectId(taskId, "task ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(updatedBy, "updater ID");

  const task = await Task.findOne({
    _id: taskId,
    businessId,
    isActive: true,
  });

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertTaskAccess(task, recordAccess);
  }

  task.status = "COMPLETED";

  task.completedAt = new Date();

  await task.save();

  return getTaskById(task._id, businessId);
};

module.exports = {
  validateObjectId,
  getTaskById,
  createTask,
  getTasksByBusiness,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  completeTask,
};
