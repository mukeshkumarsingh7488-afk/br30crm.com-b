const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const { resolveRecordAccess, applyRecordVisibility, assertRecordAccess } = require("../../utils/recordAccess");

const Activity = require("./activity.model");

const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Lead = require("../leads/lead.model");
const Deal = require("../deals/deal.model");
const Tag = require("../tags/tag.model");
const BusinessMember = require("../business-members/business-member.model");

/*
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

/*
 * Escape user input before using it as a MongoDB regex.
 */
const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
 * Pagination helper
 */
const buildPagination = (page = 1, limit = 20) => {
  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

/*
 * Check contact belongs to business and is active.
 */
const getActiveContact = async (contactId, businessId) => {
  if (!contactId) return null;

  validateObjectId(contactId, "contact ID");

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
    status: "ACTIVE",
  }).select("_id businessId status");

  if (!contact) {
    throw new ApiError(400, "Contact not found or is inactive.");
  }

  return contact;
};

/*
 * Check company belongs to business and is active.
 */
const getActiveCompany = async (companyId, businessId) => {
  if (!companyId) return null;

  validateObjectId(companyId, "company ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
    status: "ACTIVE",
  }).select("_id businessId status");

  if (!company) {
    throw new ApiError(400, "Company not found or is inactive.");
  }

  return company;
};

/*
 * Check lead belongs to business.
 */
const getLead = async (leadId, businessId) => {
  if (!leadId) return null;

  validateObjectId(leadId, "lead ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  }).select("_id businessId status");

  if (!lead) {
    throw new ApiError(400, "Lead not found.");
  }

  return lead;
};

/*
 * Check deal belongs to business and is active.
 */
const getDeal = async (dealId, businessId) => {
  if (!dealId) return null;

  validateObjectId(dealId, "deal ID");

  const deal = await Deal.findOne({
    _id: dealId,
    businessId,
    isActive: true,
  }).select("_id businessId status isActive");

  if (!deal) {
    throw new ApiError(400, "Deal not found or is inactive.");
  }

  return deal;
};

/*
 * Check assigned user is an active member of the business.
 */
const getActiveAssignedUser = async (assignedTo, businessId) => {
  if (!assignedTo) return null;

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

/*
 * Validate tags belong to the same business.
 */
const getBusinessTags = async (tags, businessId) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  if (!Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array.");
  }

  if (tags.length > 50) {
    throw new ApiError(400, "A maximum of 50 tags can be assigned to an activity.");
  }

  const uniqueTags = [...new Set(tags.map((tag) => String(typeof tag === "object" ? tag?._id || tag?.id || tag?.tagId || "" : tag)).filter(Boolean))];

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

/*
 * Validate all related entities.
 */
const validateRelationships = async ({ businessId, assignedTo, contactId, companyId, leadId, dealId, tags }) => {
  const [assignedUser, contact, company, lead, deal, validatedTags] = await Promise.all([
    getActiveAssignedUser(assignedTo, businessId),
    getActiveContact(contactId, businessId),
    getActiveCompany(companyId, businessId),
    getLead(leadId, businessId),
    getDeal(dealId, businessId),
    getBusinessTags(tags, businessId),
  ]);

  return {
    assignedUser,
    contact,
    company,
    lead,
    deal,
    tags: validatedTags,
  };
};

/*
 * Create activity
 */
const createActivity = async ({ businessId, type, subject, description, status, priority, dueAt, assignedTo, createdBy, contactId, companyId, leadId, dealId, location, reminderAt, tags, metadata }) => {
  validateObjectId(businessId, "business ID");

  validateObjectId(createdBy, "creator ID");

  const validated = await validateRelationships({
    businessId,
    assignedTo,
    contactId,
    companyId,
    leadId,
    dealId,
    tags,
  });

  const normalizedStatus = status || "PLANNED";

  const activity = await Activity.create({
    businessId,

    type,

    subject,

    description: description || null,

    status: normalizedStatus,

    priority: priority || "MEDIUM",

    dueAt: dueAt || null,

    completedAt: normalizedStatus === "COMPLETED" ? new Date() : null,

    assignedTo: assignedTo || null,

    createdBy,

    contactId: contactId || null,

    companyId: companyId || null,

    leadId: leadId || null,

    dealId: dealId || null,

    location: location || null,

    reminderAt: reminderAt || null,

    tags: validated.tags,

    metadata: metadata || {},
  });

  return getActivityById(activity._id, businessId);
};

/*
 * Get activity by ID
 */
const getActivityById = async (activityId, businessId, access = null) => {
  validateObjectId(activityId, "activity ID");

  validateObjectId(businessId, "business ID");

  const activity = await Activity.findOne({
    _id: activityId,
    businessId,
    isDeleted: false,
  })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("contactId")
    .populate("companyId")
    .populate("leadId")
    .populate("dealId")
    .populate("tags");

  if (!activity) {
    throw new ApiError(404, "Activity not found.");
  }

  if (access) assertRecordAccess(activity, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  return activity;
};

/*
 * Get all activities of a business
 */
const getActivitiesByBusiness = async (businessId, { page = 1, limit = 20, search, status, type, assignedTo, contactId, companyId, leadId, dealId, access } = {}) => {
  validateObjectId(businessId, "business ID");

  const pagination = buildPagination(page, limit);

  const filter = {
    businessId,
    isDeleted: false,
  };

  const recordAccess = await resolveRecordAccess(businessId, access || {});
  applyRecordVisibility(filter, recordAccess, { assignedTeamField: null });

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (assignedTo) {
    validateObjectId(assignedTo, "assigned user ID");

    filter.assignedTo = assignedTo;
  }

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

  if (typeof search === "string" && search.trim()) {
    const safeSearch = escapeRegex(search.trim());

    filter.$or = [
      {
        subject: {
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
      {
        outcome: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({
        dueAt: 1,
        createdAt: -1,
      })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("contactId")
      .populate("companyId")
      .populate("leadId")
      .populate("dealId")
      .populate("tags"),

    Activity.countDocuments(filter),
  ]);

  return {
    activities,

    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

/*
 * Update activity
 */
const updateActivity = async (activityId, businessId, updates, updatedBy, access = null) => {
  validateObjectId(activityId, "activity ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(updatedBy, "updater ID");

  const activity = await Activity.findOne({
    _id: activityId,
    businessId,
    isDeleted: false,
  });

  if (!activity) {
    throw new ApiError(404, "Activity not found.");
  }

  if (access) assertRecordAccess(activity, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  const hasAssignedTo = Object.prototype.hasOwnProperty.call(updates, "assignedTo");

  const hasContactId = Object.prototype.hasOwnProperty.call(updates, "contactId");

  const hasCompanyId = Object.prototype.hasOwnProperty.call(updates, "companyId");

  const hasLeadId = Object.prototype.hasOwnProperty.call(updates, "leadId");

  const hasDealId = Object.prototype.hasOwnProperty.call(updates, "dealId");

  const hasTags = Object.prototype.hasOwnProperty.call(updates, "tags");

  let validatedTags = activity.tags || [];

  /*
   * Validate relationship fields only when
   * one of them is being updated.
   *
   * IMPORTANT:
   * null is intentionally preserved so
   * frontend can unassign/unlink relations.
   */
  if (hasAssignedTo || hasContactId || hasCompanyId || hasLeadId || hasDealId || hasTags) {
    const relationshipResult = await validateRelationships({
      businessId,

      assignedTo: hasAssignedTo ? updates.assignedTo : activity.assignedTo,

      contactId: hasContactId ? updates.contactId : activity.contactId,

      companyId: hasCompanyId ? updates.companyId : activity.companyId,

      leadId: hasLeadId ? updates.leadId : activity.leadId,

      dealId: hasDealId ? updates.dealId : activity.dealId,

      tags: hasTags ? updates.tags : activity.tags,
    });

    validatedTags = relationshipResult.tags;
  }

  const allowedFields = ["type", "subject", "description", "status", "priority", "dueAt", "assignedTo", "contactId", "companyId", "leadId", "dealId", "location", "outcome", "reminderAt", "metadata"];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      activity[field] = updates[field];
    }
  }

  /*
   * Save validated tags separately.
   */
  if (hasTags) {
    activity.tags = validatedTags;
  }

  /*
   * Preserve completion timestamp logic.
   */
  if (updates.status === "COMPLETED") {
    if (!activity.completedAt) {
      activity.completedAt = new Date();
    }
  }

  if (updates.status && updates.status !== "COMPLETED") {
    activity.completedAt = null;
  }

  /*
   * Audit user
   */
  activity.updatedBy = updatedBy;

  await activity.save();

  return getActivityById(activityId, businessId);
};

/*
 * Complete activity
 */
const completeActivity = async (activityId, businessId, outcome, completedBy, access = null) => {
  validateObjectId(activityId, "activity ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(completedBy, "completer ID");

  const activity = await Activity.findOne({
    _id: activityId,
    businessId,
    isDeleted: false,
  });

  if (!activity) {
    throw new ApiError(404, "Activity not found.");
  }

  if (access) assertRecordAccess(activity, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  activity.status = "COMPLETED";

  activity.completedAt = new Date();

  if (outcome !== undefined) {
    activity.outcome = outcome || null;
  }

  activity.updatedBy = completedBy;

  await activity.save();

  return getActivityById(activityId, businessId);
};

/*
 * Soft delete activity
 */
const deleteActivity = async (activityId, businessId, deletedBy, access = null) => {
  validateObjectId(activityId, "activity ID");

  validateObjectId(businessId, "business ID");

  validateObjectId(deletedBy, "deleter ID");

  const activity = await Activity.findOne({
    _id: activityId,
    businessId,
    isDeleted: false,
  });

  if (!activity) {
    throw new ApiError(404, "Activity not found.");
  }

  if (access) assertRecordAccess(activity, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  activity.isDeleted = true;

  activity.deletedAt = new Date();

  activity.deletedBy = deletedBy;

  activity.updatedBy = deletedBy;

  await activity.save();

  return activity;
};

module.exports = {
  validateObjectId,
  createActivity,
  getActivityById,
  getActivitiesByBusiness,
  updateActivity,
  completeActivity,
  deleteActivity,
};
