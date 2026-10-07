const Company = require("./company.model");

const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Team = require("../teams/team.model");
const Contact = require("../contacts/contact.model");

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

const normalizeWebsite = (website) => {
  if (!website) {
    return null;
  }

  const value = website.trim();

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return `https://${value}`;
  }

  return value;
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
    throw new ApiError(404, "Company not found in this business.");
  }

  return company;
};

const createCompany = async ({ businessId, name, legalName, email, phone, alternatePhone, website, industry, companySize, source, status, description, address, assignedTo, assignedTeamId, tags, customFields, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  if (!name || !name.toString().trim()) {
    throw new ApiError(400, "Company name is required.");
  }

  if (assignedTo) {
    await verifyBusinessMember(businessId, assignedTo);
  }

  if (assignedTeamId) {
    await verifyTeam(businessId, assignedTeamId);
  }

  const company = await Company.create({
    businessId,
    name: name.toString().trim(),
    legalName: legalName || null,
    email: normalizeEmail(email),
    phone: phone || null,
    alternatePhone: alternatePhone || null,
    website: normalizeWebsite(website),
    industry: industry || null,
    companySize: companySize || "SMALL",
    source: source || "manual",
    status: status || "ACTIVE",
    description: description || null,
    address: address || {},
    assignedTo: assignedTo || null,
    assignedTeamId: assignedTeamId || null,
    tags: Array.isArray(tags) ? [...new Set(tags)] : [],
    customFields: customFields && typeof customFields === "object" ? customFields : {},
    createdBy,
  });

  return getCompanyByIdForBusiness(company._id, businessId);
};

const getCompaniesByBusiness = async (businessId, { page = 1, limit = 10, search, status, industry, companySize, source, assignedTo, assignedTeamId, access } = {}) => {
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

  if (industry) {
    filter.industry = industry;
  }

  if (companySize) {
    filter.companySize = companySize;
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
        legalName: {
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
        website: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        industry: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate("assignedTo", "name email")
      .populate("assignedTeamId", "name slug managerId")
      .populate("tags", "name")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Company.countDocuments(filter),
  ]);

  const companyIds = companies.map((company) => company._id);

  const contactCounts = companyIds.length
    ? await Contact.aggregate([
        {
          $match: {
            businessId: companies[0]?.businessId,
            companyId: {
              $in: companyIds,
            },
          },
        },
        {
          $group: {
            _id: "$companyId",
            count: {
              $sum: 1,
            },
          },
        },
      ])
    : [];

  const contactCountMap = new Map(contactCounts.map((item) => [item._id.toString(), item.count]));

  const companiesWithCounts = companies.map((company) => ({
    ...company,
    contactCount: contactCountMap.get(company._id.toString()) || 0,
  }));

  return {
    companies: companiesWithCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCompanyById = async (companyId) => {
  validateObjectId(companyId, "company ID");

  const company = await Company.findById(companyId).populate("assignedTo", "name email").populate("assignedTeamId", "name slug managerId").populate("createdBy", "name email").populate("updatedBy", "name email").lean();

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  const contactCount = await Contact.countDocuments({
    businessId: company.businessId,
    companyId: company._id,
  });

  return {
    ...company,
    contactCount,
  };
};

const getCompanyByIdForBusiness = async (companyId, businessId, access = null) => {
  validateObjectId(companyId, "company ID");

  validateObjectId(businessId, "business ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
  })
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name slug managerId")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  if (access) assertRecordAccess(company, await resolveRecordAccess(businessId, access));

  const contactCount = await Contact.countDocuments({
    businessId,
    companyId,
  });

  return {
    ...company,
    contactCount,
  };
};

const updateCompany = async (companyId, businessId, updates, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(companyId, "company ID");

  validateObjectId(updatedBy, "updated by user ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  if (access) assertRecordAccess(company, await resolveRecordAccess(businessId, access));

  const allowedFields = ["name", "legalName", "email", "phone", "alternatePhone", "website", "industry", "companySize", "source", "status", "description", "address", "tags", "customFields"];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      company[field] = updates[field];
    }
  }

  if (updates.name !== undefined) {
    if (!updates.name || !updates.name.toString().trim()) {
      throw new ApiError(400, "Company name cannot be empty.");
    }

    company.name = updates.name.toString().trim();
  }

  if (updates.email !== undefined) {
    company.email = normalizeEmail(updates.email);
  }

  if (updates.website !== undefined) {
    company.website = normalizeWebsite(updates.website);
  }

  if (updates.tags !== undefined) {
    company.tags = Array.isArray(updates.tags) ? [...new Set(updates.tags)] : [];
  }

  if (updates.customFields !== undefined) {
    company.customFields = updates.customFields && typeof updates.customFields === "object" ? updates.customFields : {};
  }

  company.updatedBy = updatedBy;

  await company.save();

  return getCompanyByIdForBusiness(companyId, businessId);
};

const assignCompany = async (companyId, businessId, assignedTo, assignedTeamId, updatedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(companyId, "company ID");

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

  const company = await Company.findOne({
    _id: companyId,
    businessId,
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  if (access) assertRecordAccess(company, await resolveRecordAccess(businessId, access));

  company.assignedTo = assignedTo || null;

  company.assignedTeamId = assignedTeamId || null;

  company.updatedBy = updatedBy;

  await company.save();

  return getCompanyByIdForBusiness(companyId, businessId);
};

const getCompanyContacts = async (companyId, businessId, { page = 1, limit = 10, search, status, access } = {}) => {
  await getBusiness(businessId);

  validateObjectId(companyId, "company ID");

  const company = await verifyCompany(businessId, companyId);

  if (access) assertRecordAccess(company, await resolveRecordAccess(businessId, access));

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
    companyId: company._id,
  };

  const recordAccess = await resolveRecordAccess(businessId, access || {});
  applyRecordVisibility(filter, recordAccess);

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchValue = search.trim();

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
    ];
  }

  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate("companyId", "name email phone website")
      .populate("assignedTo", "name email")
      .populate("assignedTeamId", "name slug")
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
    company,
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const deleteCompany = async (companyId, businessId, deletedBy, access = null) => {
  await getBusiness(businessId);

  validateObjectId(companyId, "company ID");

  validateObjectId(deletedBy, "deleted by user ID");

  const company = await Company.findOne({
    _id: companyId,
    businessId,
  });

  if (!company) {
    throw new ApiError(404, "Company not found.");
  }

  if (access) assertRecordAccess(company, await resolveRecordAccess(businessId, access));

  const contactCount = await Contact.countDocuments({
    businessId,
    companyId,
  });

  if (contactCount > 0) {
    throw new ApiError(409, `Company cannot be deleted because ${contactCount} contact(s) are still linked to it. Remove the company relationship from those contacts first.`);
  }

  await Company.findByIdAndDelete(companyId);

  return {
    id: companyId,
    deleted: true,
  };
};

module.exports = {
  createCompany,
  getCompaniesByBusiness,
  getCompanyById,
  getCompanyByIdForBusiness,
  updateCompany,
  assignCompany,
  getCompanyContacts,
  deleteCompany,
};
