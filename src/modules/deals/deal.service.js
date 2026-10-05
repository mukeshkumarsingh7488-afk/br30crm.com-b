const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const { resolveRecordAccess, applyRecordVisibility, assertRecordAccess } = require("../../utils/recordAccess");

const Deal = require("./deal.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Pipeline = require("../pipelines/pipeline.model");
const BusinessMember = require("../business-members/business-member.model");

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const getActiveContact = async (contactId, businessId) => {
  if (!contactId) {
    return null;
  }

  validateObjectId(contactId, "contact ID");

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
    status: "ACTIVE",
  });

  if (!contact) {
    throw new ApiError(400, "Contact not found in this business or is inactive.");
  }

  return contact;
};

const getActiveCompany = async (companyId, businessId) => {
  if (!companyId) {
    return null;
  }

  validateObjectId(companyId, "company ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
    status: "ACTIVE",
  });

  if (!company) {
    throw new ApiError(400, "Company not found in this business or is inactive.");
  }

  return company;
};

const getActivePipeline = async (pipelineId, businessId) => {
  validateObjectId(pipelineId, "pipeline ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
    status: "ACTIVE",
  });

  if (!pipeline) {
    throw new ApiError(400, "Pipeline not found in this business or is inactive.");
  }

  return pipeline;
};

const getActivePipelineStage = async (pipelineId, stageId, businessId) => {
  validateObjectId(pipelineId, "pipeline ID");
  validateObjectId(stageId, "stage ID");

  const pipeline = await getActivePipeline(pipelineId, businessId);

  const stage = pipeline.stages.id(stageId);

  if (!stage) {
    throw new ApiError(400, "Stage does not belong to the selected pipeline.");
  }

  if (!stage.isActive) {
    throw new ApiError(400, "Selected pipeline stage is inactive.");
  }

  return {
    pipeline,
    stage,
  };
};

const verifyAssignedUser = async (assignedTo, businessId) => {
  if (!assignedTo) {
    return null;
  }

  validateObjectId(assignedTo, "assigned user ID");

  const member = await BusinessMember.findOne({
    businessId,
    userId: assignedTo,
    status: "ACTIVE",
  });

  if (!member) {
    throw new ApiError(400, "Assigned user is not an active member of this business.");
  }

  return member;
};

const getDealById = async (dealId, businessId = null, access = null) => {
  validateObjectId(dealId, "deal ID");

  const filter = {
    _id: dealId,
  };

  if (businessId) {
    validateObjectId(businessId, "business ID");
    filter.businessId = businessId;
  }

  const deal = await Deal.findOne(filter)
    .populate("contactId", "firstName lastName email phone")
    .populate("companyId", "name email phone")
    .populate("pipelineId", "name slug type status stages")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  if (access) assertRecordAccess(deal, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  return deal;
};

const createDeal = async ({ businessId, pipelineId, stageId, contactId = null, companyId = null, name, description = null, value = 0, currency = "INR", expectedCloseDate = null, status = "OPEN", probability = 0, source = null, assignedTo = null, createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "creator ID");

  if (!name || !name.trim()) {
    throw new ApiError(400, "Deal name is required.");
  }

  if (value < 0) {
    throw new ApiError(400, "Deal value cannot be negative.");
  }

  if (probability < 0 || probability > 100) {
    throw new ApiError(400, "Probability must be between 0 and 100.");
  }

  if (!["OPEN", "WON", "LOST"].includes(status)) {
    throw new ApiError(400, "Invalid deal status.");
  }

  const { pipeline, stage } = await getActivePipelineStage(pipelineId, stageId, businessId);

  const contact = await getActiveContact(contactId, businessId);
  const company = await getActiveCompany(companyId, businessId);

  await verifyAssignedUser(assignedTo, businessId);

  const deal = await Deal.create({
    businessId,
    pipelineId: pipeline._id,
    stageId: stage._id,
    contactId: contact ? contact._id : null,
    companyId: company ? company._id : null,
    name: name.trim(),
    description,
    value,
    currency,
    expectedCloseDate,
    status,
    probability,
    source,
    assignedTo: assignedTo || null,
    createdBy,
  });

  return getDealById(deal._id, businessId);
};

const getDealsByBusiness = async (businessId, { page = 1, limit = 20, search = "", status, pipelineId, stageId, assignedTo, contactId, companyId, includeInactive = false, access } = {}) => {
  validateObjectId(businessId, "business ID");

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
  };

  const recordAccess = await resolveRecordAccess(businessId, access || {});
  applyRecordVisibility(filter, recordAccess, { assignedTeamField: null });

  if (!includeInactive) {
    filter.isActive = true;
  }

  if (search && search.trim()) {
    filter.$or = [
      {
        name: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (pipelineId) {
    validateObjectId(pipelineId, "pipeline ID");
    filter.pipelineId = pipelineId;
  }

  if (stageId) {
    validateObjectId(stageId, "stage ID");
    filter.stageId = stageId;
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

  const skip = (currentPage - 1) * currentLimit;

  const [deals, total] = await Promise.all([
    Deal.find(filter).populate("contactId", "firstName lastName email phone").populate("companyId", "name email phone").populate("pipelineId", "name slug type status").populate("assignedTo", "name email").populate("createdBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(currentLimit),

    Deal.countDocuments(filter),
  ]);

  return {
    deals,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
      hasNextPage: currentPage * currentLimit < total,
      hasPreviousPage: currentPage > 1,
    },
  };
};

const updateDeal = async (dealId, businessId, updates, updatedBy, access = null) => {
  validateObjectId(dealId, "deal ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const deal = await Deal.findOne({
    _id: dealId,
    businessId,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  if (access) assertRecordAccess(deal, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  let targetPipelineId = deal.pipelineId;
  let targetStageId = deal.stageId;

  if (Object.prototype.hasOwnProperty.call(updates, "pipelineId")) {
    validateObjectId(updates.pipelineId, "pipeline ID");
    targetPipelineId = updates.pipelineId;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "stageId")) {
    validateObjectId(updates.stageId, "stage ID");
    targetStageId = updates.stageId;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "pipelineId") || Object.prototype.hasOwnProperty.call(updates, "stageId")) {
    const { pipeline, stage } = await getActivePipelineStage(targetPipelineId, targetStageId, businessId);

    deal.pipelineId = pipeline._id;
    deal.stageId = stage._id;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "contactId")) {
    if (updates.contactId) {
      const contact = await getActiveContact(updates.contactId, businessId);

      deal.contactId = contact._id;
    } else {
      deal.contactId = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "companyId")) {
    if (updates.companyId) {
      const company = await getActiveCompany(updates.companyId, businessId);

      deal.companyId = company._id;
    } else {
      deal.companyId = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "name")) {
    if (!updates.name || !updates.name.trim()) {
      throw new ApiError(400, "Deal name cannot be empty.");
    }

    deal.name = updates.name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    deal.description = updates.description || null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "value")) {
    if (updates.value < 0) {
      throw new ApiError(400, "Deal value cannot be negative.");
    }

    deal.value = updates.value;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "currency")) {
    deal.currency = updates.currency;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "expectedCloseDate")) {
    deal.expectedCloseDate = updates.expectedCloseDate || null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "probability")) {
    if (updates.probability < 0 || updates.probability > 100) {
      throw new ApiError(400, "Probability must be between 0 and 100.");
    }

    deal.probability = updates.probability;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "source")) {
    deal.source = updates.source || null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    const newStatus = updates.status;

    if (!["OPEN", "WON", "LOST"].includes(newStatus)) {
      throw new ApiError(400, "Invalid deal status.");
    }

    deal.status = newStatus;

    if (newStatus === "WON") {
      deal.wonAt = new Date();
      deal.lostAt = null;
      deal.lostReason = null;
    }

    if (newStatus === "LOST") {
      deal.lostAt = new Date();
      deal.wonAt = null;

      if (Object.prototype.hasOwnProperty.call(updates, "lostReason")) {
        deal.lostReason = updates.lostReason || null;
      }
    }

    if (newStatus === "OPEN") {
      deal.wonAt = null;
      deal.lostAt = null;
      deal.lostReason = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "lostReason") && deal.status === "LOST") {
    deal.lostReason = updates.lostReason || null;
  }

  deal.updatedBy = updatedBy;

  await deal.save();

  return getDealById(dealId, businessId);
};

const deleteDeal = async (dealId, businessId, deletedBy, access = null) => {
  validateObjectId(dealId, "deal ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(deletedBy, "deleter ID");

  const deal = await Deal.findOne({
    _id: dealId,
    businessId,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  if (access) assertRecordAccess(deal, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  deal.isActive = false;
  deal.updatedBy = deletedBy;

  await deal.save();

  return deal;
};

const assignDeal = async (dealId, businessId, userId, updatedBy, access = null) => {
  validateObjectId(dealId, "deal ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");
  validateObjectId(updatedBy, "updater ID");

  const deal = await Deal.findOne({
    _id: dealId,
    businessId,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  if (access) assertRecordAccess(deal, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  await verifyAssignedUser(userId, businessId);

  deal.assignedTo = userId;
  deal.updatedBy = updatedBy;

  await deal.save();

  return getDealById(dealId, businessId);
};

const moveDeal = async (dealId, businessId, stageId, updatedBy, access = null) => {
  validateObjectId(dealId, "deal ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(stageId, "stage ID");
  validateObjectId(updatedBy, "updater ID");

  const deal = await Deal.findOne({
    _id: dealId,
    businessId,
  });

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  if (access) assertRecordAccess(deal, await resolveRecordAccess(businessId, access), { assignedTeamField: null });

  const { stage } = await getActivePipelineStage(deal.pipelineId, stageId, businessId);

  deal.stageId = stage._id;
  deal.updatedBy = updatedBy;

  await deal.save();

  return getDealById(dealId, businessId);
};

module.exports = {
  validateObjectId,
  getDealById,
  createDeal,
  getDealsByBusiness,
  updateDeal,
  deleteDeal,
  assignDeal,
  moveDeal,
};
