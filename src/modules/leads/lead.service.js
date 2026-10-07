const Lead = require("./lead.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Team = require("../teams/team.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const LeadAttribution = require("../lead-attribution/lead-attribution.model");

const ApiError = require("../../utils/ApiError");
const { resolveRecordAccess, applyRecordVisibility, assertRecordAccess } = require("../../utils/recordAccess");

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id.toString())) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const normalizeEmail = (email) => {
  if (!email) {
    return null;
  }

  return email.toLowerCase().trim();
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

const verifyBusinessMember = async (businessId, userId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");

  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).lean();

  if (!member) {
    throw new ApiError(400, "Assigned user is not an active member of this business.");
  }

  return member;
};

const verifyTeam = async (businessId, teamId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(teamId, "team ID");

  const team = await Team.findOne({
    _id: teamId,
    businessId,
    status: "ACTIVE",
  }).lean();

  if (!team) {
    throw new ApiError(400, "Selected team does not belong to this business or is inactive.");
  }

  return team;
};

const verifyCompany = async (businessId, companyId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(companyId, "company ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
  }).lean();

  if (!company) {
    throw new ApiError(400, "Selected company does not belong to this business.");
  }

  return company;
};

const verifyLead = async (businessId, leadId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(leadId, "lead ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  }).lean();

  if (!lead) {
    throw new ApiError(400, "Selected lead does not belong to this business.");
  }

  return lead;
};

const createLead = async ({ businessId, firstName, lastName, name, email, phone, companyName, jobTitle, source, status, rating, description, assignedTo, assignedTeamId, tags, customFields, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  if (assignedTo) {
    await verifyBusinessMember(businessId, assignedTo);
  }

  if (assignedTeamId) {
    await verifyTeam(businessId, assignedTeamId);
  }

  const normalizedEmail = normalizeEmail(email);

  const normalizedSource =
    String(source || "manual")
      .trim()
      .toLowerCase() || "manual";

  const lead = await Lead.create({
    businessId,
    firstName: firstName || null,
    lastName: lastName || null,
    name: name || null,
    email: normalizedEmail,
    phone: phone || null,
    companyName: companyName || null,
    jobTitle: jobTitle || null,
    source: normalizedSource,
    status: status || "NEW",
    rating: rating || "WARM",
    description: description || null,
    assignedTo: assignedTo || null,
    assignedTeamId: assignedTeamId || null,
    tags: Array.isArray(tags) ? [...new Set(tags)] : [],
    customFields: customFields && typeof customFields === "object" ? customFields : {},
    createdBy,
  });

  await LeadAttribution.create({
    businessId,
    leadId: lead._id,
    source: normalizedSource,
    attributionType: "FIRST_TOUCH",
    touchType: "FIRST",
    capturedAt: lead.createdAt || new Date(),
    createdBy,
  });

  return getLeadByIdForBusiness(lead._id, businessId);
};

const getLeadsByBusiness = async (businessId, { page = 1, limit = 10, search, status, rating, source, assignedTo, assignedTeamId, access } = {}) => {
  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

  const recordAccess = await resolveRecordAccess(businessId, access || {});
  applyRecordVisibility(filter, recordAccess);

  if (status) {
    filter.status = status;
  }

  if (rating) {
    filter.rating = rating;
  }

  if (source) {
    filter.source = source.toLowerCase().trim();
  }

  if (assignedTo) {
    validateObjectId(assignedTo, "assigned user ID");
    filter.assignedTo = assignedTo;
  }

  if (assignedTeamId) {
    validateObjectId(assignedTeamId, "assigned team ID");
    filter.assignedTeamId = assignedTeamId;
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
        firstName: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        companyName: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([Lead.find(filter).populate("assignedTo", "name email").populate("assignedTeamId", "name slug managerId").populate("tags", "name slug color type isActive").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Lead.countDocuments(filter)]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getLeadById = async (leadId) => {
  validateObjectId(leadId, "lead ID");

  const lead = await Lead.findById(leadId)
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("tags", "name slug color type isActive")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("convertedContactId", "firstName lastName email phone")
    .populate("convertedCompanyId", "name email phone website")
    .populate("convertedDealId")
    .lean();

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  return lead;
};

const getLeadByIdForBusiness = async (leadId, businessId, access = null) => {
  validateObjectId(leadId, "lead ID");
  validateObjectId(businessId, "business ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  })
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("tags", "name slug color type isActive")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("convertedContactId", "firstName lastName email phone")
    .populate("convertedCompanyId", "name email phone website")
    .populate("convertedDealId")
    .lean();

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (access) {
    const recordAccess = await resolveRecordAccess(businessId, access);
    assertRecordAccess(lead, recordAccess);
  }

  return lead;
};

const updateLead = async (leadId, businessId, updates, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(leadId, "lead ID");
  validateObjectId(updatedBy, "updated by user ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (access) assertRecordAccess(lead, await resolveRecordAccess(businessId, access));

  const previousSource = lead.source || "manual";
  const allowedFields = ["firstName", "lastName", "name", "email", "phone", "companyName", "jobTitle", "source", "status", "rating", "description", "tags", "customFields"];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      lead[field] = updates[field];
    }
  }

  if (updates.email !== undefined) {
    lead.email = normalizeEmail(updates.email);
  }

  if (updates.tags !== undefined) {
    lead.tags = Array.isArray(updates.tags) ? [...new Set(updates.tags)] : [];
  }

  if (updates.customFields !== undefined) {
    lead.customFields = updates.customFields && typeof updates.customFields === "object" ? updates.customFields : {};
  }

  if (updates.status === "CONTACTED") {
    lead.lastContactedAt = new Date();
  }

  if (updates.status === "CONVERTED" && lead.status !== "CONVERTED") {
    lead.convertedAt = new Date();
  }

  lead.updatedBy = updatedBy;

  await lead.save();

  if (
    updates.source !== undefined &&
    String(updates.source || "manual")
      .trim()
      .toLowerCase() !== String(previousSource).trim().toLowerCase()
  ) {
    await LeadAttribution.create({
      businessId,
      leadId: lead._id,
      source:
        String(updates.source || "manual")
          .trim()
          .toLowerCase() || "manual",
      attributionType: "LAST_TOUCH",
      touchType: "LAST",
      capturedAt: new Date(),
      createdBy: updatedBy,
    });
  }

  return getLeadByIdForBusiness(leadId, businessId);
};

const assignLead = async (leadId, businessId, assignedTo, assignedTeamId, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(leadId, "lead ID");
  validateObjectId(updatedBy, "updated by user ID");

  if (!assignedTo && !assignedTeamId) {
    throw new ApiError(400, "Either assigned user or assigned team is required.");
  }

  if (assignedTo) {
    await verifyBusinessMember(businessId, assignedTo);
  }

  if (assignedTeamId) {
    await verifyTeam(businessId, assignedTeamId);
  }

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (access) assertRecordAccess(lead, await resolveRecordAccess(businessId, access));

  lead.assignedTo = assignedTo || null;
  lead.assignedTeamId = assignedTeamId || null;
  lead.updatedBy = updatedBy;

  await lead.save();

  return getLeadByIdForBusiness(leadId, businessId);
};

const convertLead = async ({ leadId, businessId, companyId, convertedBy }) => {
  await getBusiness(businessId);

  validateObjectId(leadId, "lead ID");
  validateObjectId(convertedBy, "converted by user ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (lead.status === "CONVERTED") {
    throw new ApiError(409, "Lead has already been converted.");
  }

  if (lead.convertedContactId || lead.convertedCompanyId || lead.convertedDealId) {
    throw new ApiError(409, "Lead already contains conversion references.");
  }

  let company = null;

  if (companyId) {
    company = await verifyCompany(businessId, companyId);
  }

  if (!company && lead.companyName) {
    const companyName = lead.companyName.trim();

    company = await Company.findOne({
      businessId,
      name: {
        $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
  }

  if (!company && lead.companyName) {
    company = await Company.create({
      businessId,
      name: lead.companyName.trim(),
      legalName: null,
      email: normalizeEmail(lead.email),
      phone: lead.phone || null,
      alternatePhone: null,
      website: null,
      industry: null,
      companySize: "SMALL",
      source: lead.source || "lead_conversion",
      status: "ACTIVE",
      description: null,
      address: {},
      assignedTo: lead.assignedTo || null,
      assignedTeamId: lead.assignedTeamId || null,
      tags: Array.isArray(lead.tags) ? [...new Set(lead.tags.map((tag) => tag.toString()))] : [],
      customFields: lead.customFields && typeof lead.customFields === "object" ? lead.customFields : {},
      createdBy: convertedBy,
    });
  }

  let firstName = lead.firstName;

  let lastName = lead.lastName || null;

  if (!firstName && lead.name) {
    const nameParts = lead.name.trim().split(/\s+/);

    firstName = nameParts.shift() || null;

    if (!lastName && nameParts.length > 0) {
      lastName = nameParts.join(" ");
    }
  }

  if (!firstName) {
    throw new ApiError(400, "Lead cannot be converted because a contact first name is required.");
  }

  const contact = await Contact.create({
    businessId,
    firstName,
    lastName,
    email: normalizeEmail(lead.email),
    phone: lead.phone || null,
    alternatePhone: null,
    jobTitle: lead.jobTitle || null,
    companyId: company ? company._id : null,
    source: lead.source || "lead_conversion",
    status: "ACTIVE",
    lifecycleStage: "CONTACT",
    description: lead.description || null,
    address: {},
    assignedTo: lead.assignedTo || null,
    assignedTeamId: lead.assignedTeamId || null,
    tags: Array.isArray(lead.tags) ? [...new Set(lead.tags.map((tag) => tag.toString()))] : [],
    customFields: lead.customFields && typeof lead.customFields === "object" ? lead.customFields : {},
    sourceLeadId: lead._id,
    createdBy: convertedBy,
  });

  lead.status = "CONVERTED";
  lead.convertedAt = new Date();
  lead.convertedContactId = contact._id;
  lead.convertedCompanyId = company ? company._id : null;
  lead.updatedBy = convertedBy;

  await lead.save();

  const convertedLead = await getLeadByIdForBusiness(lead._id, businessId);

  const convertedContact = await Contact.findOne({
    _id: contact._id,
    businessId,
  })
    .populate("companyId", "name email phone website")
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("sourceLeadId", "name email status")
    .populate("createdBy", "name email")
    .lean();

  let convertedCompany = null;

  if (company) {
    convertedCompany = await Company.findOne({
      _id: company._id,
      businessId,
    })
      .populate("assignedTo", "name email")
      .populate("assignedTeamId", "name slug managerId")
      .populate("createdBy", "name email")
      .lean();
  }

  return {
    lead: convertedLead,
    contact: convertedContact,
    company: convertedCompany,
  };
};

const deleteLead = async (leadId, businessId, deletedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(leadId, "lead ID");
  validateObjectId(deletedBy, "deleted by user ID");

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  if (lead.status === "CONVERTED") {
    throw new ApiError(409, "Converted lead cannot be deleted.");
  }

  await Lead.findByIdAndDelete(leadId);

  return {
    id: leadId,
    deleted: true,
  };
};

module.exports = {
  createLead,
  getLeadsByBusiness,
  getLeadById,
  getLeadByIdForBusiness,
  updateLead,
  assignLead,
  convertLead,
  deleteLead,
};
