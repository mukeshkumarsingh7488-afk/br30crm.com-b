const mongoose = require("mongoose");
const AnalyticsSnapshot = require("./analytics.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const Task = require("../tasks/task.model");
const Activity = require("../activities/activity.model");
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

const normalizeDateRange = ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid startDate or endDate");
  }

  if (start > end) {
    throw new ApiError(400, "startDate cannot be greater than endDate");
  }

  end.setHours(23, 59, 59, 999);

  return {
    startDate: start,
    endDate: end,
  };
};

const getCollectionCount = async (Model, businessId, startDate, endDate) => {
  return Model.countDocuments({
    businessId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

const getBasicOverview = async ({ businessId, startDate, endDate }) => {
  const [leads, contacts, companies, deals, tasks, activities] = await Promise.all([
    getCollectionCount(Lead, businessId, startDate, endDate),
    getCollectionCount(Contact, businessId, startDate, endDate),
    getCollectionCount(Company, businessId, startDate, endDate),
    getCollectionCount(Deal, businessId, startDate, endDate),
    getCollectionCount(Task, businessId, startDate, endDate),
    getCollectionCount(Activity, businessId, startDate, endDate),
  ]);

  return {
    leads,
    contacts,
    companies,
    deals,
    tasks,
    activities,
  };
};

const getOverview = async ({ businessId, userId, startDate, endDate }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const range = normalizeDateRange({
    startDate,
    endDate,
  });

  const overview = await getBasicOverview({
    businessId,
    ...range,
  });

  return {
    period: range,
    overview,
  };
};

const getMetric = async ({ businessId, userId, metric, startDate, endDate }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const range = normalizeDateRange({
    startDate,
    endDate,
  });

  const models = {
    leads: Lead,
    contacts: Contact,
    companies: Company,
    deals: Deal,
    tasks: Task,
    activities: Activity,
  };

  const Model = models[metric];

  if (!Model) {
    throw new ApiError(400, "Unsupported analytics metric");
  }

  const value = await getCollectionCount(Model, businessId, range.startDate, range.endDate);

  return {
    metric,
    value,
    period: range,
  };
};

const getSnapshots = async ({ businessId, userId, metric, period, startDate, endDate, page = 1, limit = 20 }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {
    businessId,
  };

  if (metric) {
    filter.metric = metric;
  }

  if (period) {
    filter.period = period;
  }

  if (startDate || endDate) {
    filter.startDate = {};

    if (startDate) {
      const start = new Date(startDate);

      if (Number.isNaN(start.getTime())) {
        throw new ApiError(400, "Invalid startDate");
      }

      filter.startDate.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);

      if (Number.isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid endDate");
      }

      filter.startDate.$lte = end;
    }
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [snapshots, total] = await Promise.all([
    AnalyticsSnapshot.find(filter)
      .populate("generatedBy", "name email")
      .sort({
        startDate: -1,
        generatedAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    AnalyticsSnapshot.countDocuments(filter),
  ]);

  return {
    snapshots,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const getSnapshotById = async ({ businessId, userId, snapshotId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(snapshotId)) {
    throw new ApiError(400, "Invalid snapshot ID");
  }

  const snapshot = await AnalyticsSnapshot.findOne({
    _id: snapshotId,
    businessId,
  }).populate("generatedBy", "name email");

  if (!snapshot) {
    throw new ApiError(404, "Analytics snapshot not found");
  }

  return snapshot;
};

const createSnapshot = async ({ businessId, userId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  const range = normalizeDateRange({
    startDate: data.startDate,
    endDate: data.endDate,
  });

  const models = {
    leads: Lead,
    contacts: Contact,
    companies: Company,
    deals: Deal,
    tasks: Task,
    activities: Activity,
  };

  const Model = models[data.metric];

  if (!Model) {
    throw new ApiError(400, "Unsupported analytics metric");
  }

  const value = await getCollectionCount(Model, businessId, range.startDate, range.endDate);

  const snapshot = await AnalyticsSnapshot.create({
    businessId,
    metric: data.metric,
    period: data.period || "CUSTOM",
    startDate: range.startDate,
    endDate: range.endDate,
    value,
    dimensions: data.dimensions || {},
    breakdown: data.breakdown || {},
    metadata: data.metadata || {},
    generatedAt: new Date(),
    generatedBy: userId,
  });

  return snapshot;
};

const deleteSnapshot = async ({ businessId, userId, snapshotId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);

  if (!isValidObjectId(snapshotId)) {
    throw new ApiError(400, "Invalid snapshot ID");
  }

  const snapshot = await AnalyticsSnapshot.findOneAndDelete({
    _id: snapshotId,
    businessId,
  });

  if (!snapshot) {
    throw new ApiError(404, "Analytics snapshot not found");
  }

  return snapshot;
};

module.exports = {
  getOverview,
  getMetric,
  getSnapshots,
  getSnapshotById,
  createSnapshot,
  deleteSnapshot,
};
