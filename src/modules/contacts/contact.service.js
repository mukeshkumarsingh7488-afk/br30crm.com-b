const Contact = require("./contact.model");

const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Team = require("../teams/team.model");
const Company = require("../companies/company.model");
const Lead = require("../leads/lead.model");

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
  validateObjectId(businessId, "team ID");
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

/*
 * ============================================================
 * COMPANY RELATIONSHIP VALIDATION
 * ============================================================
 *
 * Contact can only be linked to:
 * - a company inside the same business
 * - an ACTIVE company
 *
 * This prevents cross-business relationships and prevents
 * contacts from being attached to inactive companies.
 * ============================================================
 */
const verifyCompany = async (businessId, companyId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(companyId, "company ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
    status: "ACTIVE",
  }).lean();

  if (!company) {
    throw new ApiError(400, "Selected company does not belong to this business or is inactive.");
  }

  return company;
};

/*
 * ============================================================
 * LEAD RELATIONSHIP VALIDATION
 * ============================================================
 *
 * sourceLeadId must always point to a Lead belonging to the
 * same business.
 *
 * This protects the tenant boundary and prevents a Contact
 * from referencing a Lead from another business.
 * ============================================================
 */
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

/*
 * ============================================================
 * COMPANY RELATIONSHIP RESOLVER
 * ============================================================
 *
 * Passing null / empty value:
 * - removes company relationship
 *
 * Passing company ID:
 * - verifies same business
 * - verifies company is ACTIVE
 * - returns company document
 * ============================================================
 */
const resolveCompany = async (businessId, companyId) => {
  if (!companyId) {
    return null;
  }

  return verifyCompany(businessId, companyId);
};

/*
 * ============================================================
 * CREATE CONTACT
 * ============================================================
 */
const createContact = async ({ businessId, firstName, lastName, email, phone, alternatePhone, jobTitle, companyId, source, status, lifecycleStage, description, address, assignedTo, assignedTeamId, tags, customFields, sourceLeadId, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  if (!firstName || !firstName.toString().trim()) {
    throw new ApiError(400, "First name is required.");
  }

  if (assignedTo) {
    await verifyBusinessMember(businessId, assignedTo);
  }

  if (assignedTeamId) {
    await verifyTeam(businessId, assignedTeamId);
  }

  const company = await resolveCompany(businessId, companyId);

  if (sourceLeadId) {
    await verifyLead(businessId, sourceLeadId);
  }

  const contact = await Contact.create({
    businessId,
    firstName: firstName.toString().trim(),
    lastName: lastName ? lastName.toString().trim() : null,
    email: normalizeEmail(email),
    phone: phone || null,
    alternatePhone: alternatePhone || null,
    jobTitle: jobTitle || null,
    companyId: company ? company._id : null,
    source: source || "manual",
    status: status || "ACTIVE",
    lifecycleStage: lifecycleStage || "CONTACT",
    description: description || null,
    address: address || {},
    assignedTo: assignedTo || null,
    assignedTeamId: assignedTeamId || null,
    tags: Array.isArray(tags) ? [...new Set(tags)] : [],
    customFields: customFields && typeof customFields === "object" ? customFields : {},
    sourceLeadId: sourceLeadId || null,
    createdBy,
  });

  return getContactByIdForBusiness(contact._id, businessId);
};

/*
 * ============================================================
 * GET CONTACTS BY BUSINESS
 * ============================================================
 *
 * Supports:
 * - pagination
 * - first/last name search
 * - email search
 * - phone search
 * - alternate phone search
 * - job title search
 * - company name search
 * - status filter
 * - lifecycle stage filter
 * - source filter
 * - company filter
 * - assigned user filter
 * - assigned team filter
 *
 * Company name search is resolved to company IDs first so that
 * the actual Contact query remains business-safe.
 * ============================================================
 */
const getContactsByBusiness = async (businessId, { page = 1, limit = 10, search, status, lifecycleStage, source, companyId, assignedTo, assignedTeamId, access } = {}) => {
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

  if (lifecycleStage) {
    filter.lifecycleStage = lifecycleStage;
  }

  if (source) {
    filter.source = source.toLowerCase().trim();
  }

  /*
   * ----------------------------------------------------------
   * Company filter
   * ----------------------------------------------------------
   *
   * Always verify the selected company belongs to the same
   * business and is active.
   * ----------------------------------------------------------
   */
  if (companyId) {
    validateObjectId(companyId, "company ID");

    await verifyCompany(businessId, companyId);

    filter.companyId = companyId;
  }

  if (assignedTo) {
    validateObjectId(assignedTo, "assigned user ID");

    filter.assignedTo = assignedTo;
  }

  if (assignedTeamId) {
    validateObjectId(assignedTeamId, "assigned team ID");

    filter.assignedTeamId = assignedTeamId;
  }

  /*
   * ----------------------------------------------------------
   * Search
   * ----------------------------------------------------------
   *
   * Search directly on Contact fields.
   *
   * For company name:
   * 1. Search companies within this business only.
   * 2. Get matching company IDs.
   * 3. Include those IDs in Contact search.
   *
   * This avoids cross-business company matches.
   * ----------------------------------------------------------
   */
  if (search && search.trim()) {
    const searchValue = search.trim();

    const matchingCompanies = await Company.find({
      businessId,
      status: "ACTIVE",
      $or: [
        {
          name: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          legalName: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    const matchingCompanyIds = matchingCompanies.map((company) => company._id);

    filter.$or = [
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
        alternatePhone: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        jobTitle: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];

    if (matchingCompanyIds.length > 0) {
      filter.$or.push({
        companyId: {
          $in: matchingCompanyIds,
        },
      });
    }
  }

  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate("companyId", "name legalName email phone website industry companySize status")
      .populate("assignedTo", "name email")
      .populate("assignedTeamId", "name slug managerId")
      .populate("sourceLeadId", "name email status")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Contact.countDocuments(filter),
  ]);

  return {
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*
 * ============================================================
 * GET CONTACT BY ID
 * ============================================================
 */
const getContactById = async (contactId) => {
  validateObjectId(contactId, "contact ID");

  const contact = await Contact.findById(contactId)
    .populate("companyId", "name legalName email phone website industry companySize status")
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("sourceLeadId", "name email status")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  return contact;
};

/*
 * ============================================================
 * GET CONTACT BY ID FOR BUSINESS
 * ============================================================
 *
 * Business ID is always included in the query so that a
 * Contact from another business can never be returned.
 * ============================================================
 */
const getContactByIdForBusiness = async (contactId, businessId, access = null) => {
  validateObjectId(contactId, "contact ID");
  validateObjectId(businessId, "business ID");

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
  })
    .populate("companyId", "name legalName email phone website industry companySize status")
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("sourceLeadId", "name email status")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  if (access) assertRecordAccess(contact, await resolveRecordAccess(businessId, access));

  return contact;
};

/*
 * ============================================================
 * UPDATE CONTACT
 * ============================================================
 */
const updateContact = async (contactId, businessId, updates, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(contactId, "contact ID");
  validateObjectId(updatedBy, "updated by user ID");

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  if (access) assertRecordAccess(contact, await resolveRecordAccess(businessId, access));

  if (updates.firstName !== undefined && !updates.firstName) {
    throw new ApiError(400, "First name cannot be empty.");
  }

  const allowedFields = ["firstName", "lastName", "email", "phone", "alternatePhone", "jobTitle", "companyId", "source", "status", "lifecycleStage", "description", "address", "tags", "customFields"];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      contact[field] = updates[field];
    }
  }

  if (updates.firstName !== undefined) {
    contact.firstName = updates.firstName.toString().trim();
  }

  if (updates.lastName !== undefined) {
    contact.lastName = updates.lastName ? updates.lastName.toString().trim() : null;
  }

  if (updates.email !== undefined) {
    contact.email = normalizeEmail(updates.email);
  }

  /*
   * Company relationship update.
   *
   * companyId:
   * - valid ID → attach contact to company
   * - null / empty → detach contact from company
   */
  if (updates.companyId !== undefined) {
    const company = await resolveCompany(businessId, updates.companyId);

    contact.companyId = company ? company._id : null;
  }

  if (updates.tags !== undefined) {
    contact.tags = Array.isArray(updates.tags) ? [...new Set(updates.tags)] : [];
  }

  if (updates.customFields !== undefined) {
    contact.customFields = updates.customFields && typeof updates.customFields === "object" ? updates.customFields : {};
  }

  contact.updatedBy = updatedBy;

  await contact.save();

  return getContactByIdForBusiness(contactId, businessId);
};

/*
 * ============================================================
 * ASSIGN CONTACT
 * ============================================================
 */
const assignContact = async (contactId, businessId, assignedTo, assignedTeamId, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(contactId, "contact ID");
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

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  if (access) assertRecordAccess(contact, await resolveRecordAccess(businessId, access));

  contact.assignedTo = assignedTo || null;
  contact.assignedTeamId = assignedTeamId || null;
  contact.updatedBy = updatedBy;

  await contact.save();

  return getContactByIdForBusiness(contactId, businessId);
};

/*
 * ============================================================
 * DELETE CONTACT
 * ============================================================
 *
 * IMPORTANT:
 *
 * If a Lead was converted into this Contact, the Lead keeps
 * convertedContactId pointing to the Contact.
 *
 * Deleting such a Contact would create a dangling Lead →
 * Contact reference.
 *
 * Therefore converted Contacts cannot be deleted directly.
 * The Lead conversion relationship remains consistent.
 * ============================================================
 */
const deleteContact = async (contactId, businessId, deletedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(contactId, "contact ID");
  validateObjectId(deletedBy, "deleted by user ID");

  const contact = await Contact.findOne({
    _id: contactId,
    businessId,
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found.");
  }

  if (access) assertRecordAccess(contact, await resolveRecordAccess(businessId, access));

  /*
   * Check both sides of the Lead ↔ Contact relationship.
   *
   * 1. Contact.sourceLeadId
   * 2. Lead.convertedContactId
   *
   * The second check is the important integrity protection
   * for converted Leads.
   */
  const linkedConvertedLead = await Lead.findOne({
    businessId,
    convertedContactId: contact._id,
  })
    .select("_id name firstName lastName status")
    .lean();

  if (linkedConvertedLead) {
    throw new ApiError(409, "This contact was created from a converted lead and cannot be deleted while the lead conversion relationship exists.");
  }

  await Contact.findOneAndDelete({
    _id: contactId,
    businessId,
  });

  return {
    id: contactId,
    deleted: true,
  };
};

module.exports = {
  createContact,
  getContactsByBusiness,
  getContactById,
  getContactByIdForBusiness,
  updateContact,
  assignContact,
  deleteContact,
};
