const Report = require("./report.model");

const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const Task = require("../tasks/task.model");
const Activity = require("../activities/activity.model");

const ApiError = require("../../utils/ApiError");

const MODELS = {
  leads: Lead,
  contacts: Contact,
  companies: Company,
  deals: Deal,
  tasks: Task,
};

const ALLOWED_FILTERS = new Set(["status", "source", "assignedTo", "assignedTeamId", "pipelineId", "stageId", "lifecycleStage", "companyId"]);

const cleanFilters = (filters = {}) => {
  const output = {};

  for (const [key, value] of Object.entries(filters || {})) {
    if (!ALLOWED_FILTERS.has(key)) continue;

    if (value === "" || value === null || value === undefined) {
      continue;
    }

    output[key] = value;
  }

  return output;
};

const create = async ({ businessId, userId, data }) => {
  if (!data.name || !MODELS[data.source]) {
    throw new ApiError(400, "Valid report name and source are required.");
  }

  return Report.create({
    businessId,
    createdBy: userId,
    name: data.name,
    description: data.description || "",
    source: data.source,
    filters: cleanFilters(data.filters),
    columns: data.columns || [],
    groupBy: data.groupBy || null,
  });
};

const list = async ({ businessId, page = 1, limit = 25 }) => {
  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const filter = {
    businessId,
  };

  const [items, total] = await Promise.all([
    Report.find(filter)
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Report.countDocuments(filter),
  ]);

  return {
    items,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const run = async ({ businessId, reportId, overrideFilters = {} }) => {
  const report = await Report.findOne({
    _id: reportId,
    businessId,
  }).lean();

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  const model = MODELS[report.source];

  const filter = {
    businessId,
    ...cleanFilters(report.filters),
    ...cleanFilters(overrideFilters),
  };

  const rows = await model.find(filter).sort({ updatedAt: -1 }).limit(5000).lean();

  const grouped = report.groupBy
    ? rows.reduce((acc, row) => {
        const key = String(row[report.groupBy] ?? "UNSET");

        acc[key] = (acc[key] || 0) + 1;

        return acc;
      }, {})
    : null;

  return {
    report,
    total: rows.length,
    rows,
    grouped,
  };
};

const getSalesReport = async ({ businessId, dateFrom, dateTo, status, source, assignedTo }) => {
  const filter = {
    businessId,
    isActive: true,
  };

  if (status && ["OPEN", "WON", "LOST"].includes(String(status).toUpperCase())) {
    filter.status = String(status).toUpperCase();
  }

  if (source) {
    filter.source = String(source);
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      const from = new Date(dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw new ApiError(400, "Invalid dateFrom.");
      }

      from.setHours(0, 0, 0, 0);

      filter.createdAt.$gte = from;
    }

    if (dateTo) {
      const to = new Date(dateTo);

      if (Number.isNaN(to.getTime())) {
        throw new ApiError(400, "Invalid dateTo.");
      }

      to.setHours(23, 59, 59, 999);

      filter.createdAt.$lte = to;
    }
  }

  const rows = await Deal.find(filter).populate("assignedTo", "name email").populate("contactId", "name email phone").populate("companyId", "name").sort({ createdAt: -1 }).limit(5000).lean();

  const summary = {
    totalDeals: rows.length,
    totalValue: 0,
    wonDeals: 0,
    wonRevenue: 0,
    openDeals: 0,
    openPipeline: 0,
    lostDeals: 0,
    lostValue: 0,
    averageDealValue: 0,
    weightedPipeline: 0,
  };

  const statusBreakdown = {};
  const sourceBreakdown = {};
  const monthlyMap = {};
  const currencyMap = {};

  rows.forEach((deal) => {
    const value = Number(deal.value) || 0;
    const probability = Number(deal.probability) || 0;

    const dealStatus = String(deal.status || "OPEN").toUpperCase();

    const currency = String(deal.currency || "INR").toUpperCase();

    summary.totalValue += value;

    if (dealStatus === "WON") {
      summary.wonDeals += 1;
      summary.wonRevenue += value;
    }

    if (dealStatus === "OPEN") {
      summary.openDeals += 1;
      summary.openPipeline += value;

      summary.weightedPipeline += value * (probability / 100);
    }

    if (dealStatus === "LOST") {
      summary.lostDeals += 1;
      summary.lostValue += value;
    }

    statusBreakdown[dealStatus] = (statusBreakdown[dealStatus] || 0) + 1;

    const dealSource = String(deal.source || "Unknown").trim() || "Unknown";

    if (!sourceBreakdown[dealSource]) {
      sourceBreakdown[dealSource] = {
        source: dealSource,
        deals: 0,
        value: 0,
        wonRevenue: 0,
      };
    }

    sourceBreakdown[dealSource].deals += 1;

    sourceBreakdown[dealSource].value += value;

    if (dealStatus === "WON") {
      sourceBreakdown[dealSource].wonRevenue += value;
    }

    currencyMap[currency] = (currencyMap[currency] || 0) + value;

    const dateValue = deal.wonAt || deal.expectedCloseDate || deal.createdAt;

    if (dateValue) {
      const date = new Date(dateValue);

      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,
            deals: 0,
            value: 0,
            wonRevenue: 0,
          };
        }

        monthlyMap[monthKey].deals += 1;

        monthlyMap[monthKey].value += value;

        if (dealStatus === "WON") {
          monthlyMap[monthKey].wonRevenue += value;
        }
      }
    }
  });

  if (summary.totalDeals > 0) {
    summary.averageDealValue = summary.totalValue / summary.totalDeals;
  }

  const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  const bySource = Object.values(sourceBreakdown).sort((a, b) => b.value - a.value);

  const byStatus = Object.entries(statusBreakdown)
    .map(([statusName, count]) => ({
      status: statusName,
      deals: count,
    }))
    .sort((a, b) => b.deals - a.deals);

  const currencies = Object.entries(currencyMap)
    .map(([currency, value]) => ({
      currency,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    filters: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: status || null,
      source: source || null,
      assignedTo: assignedTo || null,
    },

    summary,

    byStatus,

    bySource,

    monthly,

    currencies,

    rows,
  };
};

const getLeadsReport = async ({ businessId, dateFrom, dateTo, status, source, assignedTo }) => {
  const filter = {
    businessId,
  };

  const allowedStatuses = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];

  if (status && allowedStatuses.includes(String(status).toUpperCase())) {
    filter.status = String(status).toUpperCase();
  }

  if (source) {
    filter.source = String(source).trim().toLowerCase();
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      const from = new Date(dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw new ApiError(400, "Invalid dateFrom.");
      }

      from.setHours(0, 0, 0, 0);

      filter.createdAt.$gte = from;
    }

    if (dateTo) {
      const to = new Date(dateTo);

      if (Number.isNaN(to.getTime())) {
        throw new ApiError(400, "Invalid dateTo.");
      }

      to.setHours(23, 59, 59, 999);

      filter.createdAt.$lte = to;
    }
  }

  const rows = await Lead.find(filter)
    .populate("assignedTo", "name email")
    .populate("assignedTeamId", "name")
    .populate("convertedContactId", "name email phone")
    .populate("convertedCompanyId", "name")
    .populate("convertedDealId", "name value currency")
    .populate("tags", "name")
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const summary = {
    totalLeads: rows.length,

    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    unqualifiedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,

    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,

    conversionRate: 0,
    contactedRate: 0,
    qualifiedRate: 0,
  };

  const statusMap = {};
  const sourceMap = {};
  const ratingMap = {};
  const assignedUserMap = {};
  const assignedTeamMap = {};

  const monthlyMap = {};

  rows.forEach((lead) => {
    const leadStatus = String(lead.status || "NEW").toUpperCase();

    const leadRating = String(lead.rating || "WARM").toUpperCase();

    const leadSource = String(lead.source || "manual").trim() || "manual";

    if (leadStatus === "NEW") {
      summary.newLeads += 1;
    }

    if (leadStatus === "CONTACTED") {
      summary.contactedLeads += 1;
    }

    if (leadStatus === "QUALIFIED") {
      summary.qualifiedLeads += 1;
    }

    if (leadStatus === "UNQUALIFIED") {
      summary.unqualifiedLeads += 1;
    }

    if (leadStatus === "CONVERTED") {
      summary.convertedLeads += 1;
    }

    if (leadStatus === "LOST") {
      summary.lostLeads += 1;
    }

    if (leadRating === "HOT") {
      summary.hotLeads += 1;
    }

    if (leadRating === "WARM") {
      summary.warmLeads += 1;
    }

    if (leadRating === "COLD") {
      summary.coldLeads += 1;
    }

    statusMap[leadStatus] = (statusMap[leadStatus] || 0) + 1;

    sourceMap[leadSource] = (sourceMap[leadSource] || 0) + 1;

    ratingMap[leadRating] = (ratingMap[leadRating] || 0) + 1;

    const assignedUserId = lead.assignedTo?._id ? String(lead.assignedTo._id) : "UNASSIGNED";

    const assignedUserName = lead.assignedTo ? lead.assignedTo.name || lead.assignedTo.email || "Unknown User" : "Unassigned";

    if (!assignedUserMap[assignedUserId]) {
      assignedUserMap[assignedUserId] = {
        userId: assignedUserId === "UNASSIGNED" ? null : assignedUserId,

        name: assignedUserName,

        email: lead.assignedTo?.email || null,

        leads: 0,

        converted: 0,
      };
    }

    assignedUserMap[assignedUserId].leads += 1;

    if (leadStatus === "CONVERTED") {
      assignedUserMap[assignedUserId].converted += 1;
    }

    const assignedTeamId = lead.assignedTeamId?._id ? String(lead.assignedTeamId._id) : "UNASSIGNED";

    const assignedTeamName = lead.assignedTeamId ? lead.assignedTeamId.name || "Unknown Team" : "Unassigned";

    if (!assignedTeamMap[assignedTeamId]) {
      assignedTeamMap[assignedTeamId] = {
        teamId: assignedTeamId === "UNASSIGNED" ? null : assignedTeamId,

        name: assignedTeamName,

        leads: 0,

        converted: 0,
      };
    }

    assignedTeamMap[assignedTeamId].leads += 1;

    if (leadStatus === "CONVERTED") {
      assignedTeamMap[assignedTeamId].converted += 1;
    }

    if (lead.createdAt) {
      const date = new Date(lead.createdAt);

      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,
            leads: 0,
            converted: 0,
            qualified: 0,
            lost: 0,
          };
        }

        monthlyMap[monthKey].leads += 1;

        if (leadStatus === "CONVERTED") {
          monthlyMap[monthKey].converted += 1;
        }

        if (leadStatus === "QUALIFIED") {
          monthlyMap[monthKey].qualified += 1;
        }

        if (leadStatus === "LOST") {
          monthlyMap[monthKey].lost += 1;
        }
      }
    }
  });

  if (summary.totalLeads > 0) {
    summary.conversionRate = (summary.convertedLeads / summary.totalLeads) * 100;

    summary.contactedRate = ((summary.contactedLeads + summary.qualifiedLeads + summary.convertedLeads + summary.unqualifiedLeads + summary.lostLeads) / summary.totalLeads) * 100;

    summary.qualifiedRate = (summary.qualifiedLeads / summary.totalLeads) * 100;
  }

  const byStatus = Object.entries(statusMap)
    .map(([statusName, count]) => ({
      status: statusName,
      leads: count,
    }))
    .sort((a, b) => b.leads - a.leads);

  const bySource = Object.entries(sourceMap)
    .map(([sourceName, count]) => ({
      source: sourceName,
      leads: count,
    }))
    .sort((a, b) => b.leads - a.leads);

  const byRating = Object.entries(ratingMap)
    .map(([ratingName, count]) => ({
      rating: ratingName,
      leads: count,
    }))
    .sort((a, b) => b.leads - a.leads);

  const byAssignedUser = Object.values(assignedUserMap)
    .map((item) => ({
      ...item,

      conversionRate: item.leads > 0 ? (item.converted / item.leads) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const byAssignedTeam = Object.values(assignedTeamMap)
    .map((item) => ({
      ...item,

      conversionRate: item.leads > 0 ? (item.converted / item.leads) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  return {
    filters: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: status || null,
      source: source || null,
      assignedTo: assignedTo || null,
    },

    summary,

    byStatus,

    bySource,

    byRating,

    byAssignedUser,

    byAssignedTeam,

    monthly,

    rows,
  };
};

const getDealsReport = async ({ businessId, dateFrom, dateTo, status, source, assignedTo }) => {
  const filter = {
    businessId,
    isActive: true,
  };

  const allowedStatuses = ["OPEN", "WON", "LOST"];

  if (status && allowedStatuses.includes(String(status).toUpperCase())) {
    filter.status = String(status).toUpperCase();
  }

  if (source) {
    filter.source = String(source).trim();
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      const from = new Date(dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw new ApiError(400, "Invalid dateFrom.");
      }

      from.setHours(0, 0, 0, 0);

      filter.createdAt.$gte = from;
    }

    if (dateTo) {
      const to = new Date(dateTo);

      if (Number.isNaN(to.getTime())) {
        throw new ApiError(400, "Invalid dateTo.");
      }

      to.setHours(23, 59, 59, 999);

      filter.createdAt.$lte = to;
    }
  }

  const rows = await Deal.find(filter).populate("assignedTo", "name email").populate("contactId", "name email phone").populate("companyId", "name").sort({ createdAt: -1 }).limit(5000).lean();

  const summary = {
    totalDeals: rows.length,

    totalValue: 0,

    wonDeals: 0,
    wonRevenue: 0,

    openDeals: 0,
    openPipeline: 0,

    lostDeals: 0,
    lostValue: 0,

    averageDealValue: 0,

    weightedPipeline: 0,

    averageProbability: 0,

    winRate: 0,

    lossRate: 0,
  };

  const statusMap = {};
  const sourceMap = {};
  const assignedUserMap = {};
  const companyMap = {};
  const pipelineMap = {};

  const monthlyMap = {};

  const currencyMap = {};

  rows.forEach((deal) => {
    const value = Number(deal.value) || 0;

    const probability = Number(deal.probability) || 0;

    const dealStatus = String(deal.status || "OPEN").toUpperCase();

    const dealSource = String(deal.source || "Unknown").trim() || "Unknown";

    const currency = String(deal.currency || "INR")
      .trim()
      .toUpperCase();

    summary.totalValue += value;

    summary.averageProbability += probability;

    if (dealStatus === "WON") {
      summary.wonDeals += 1;
      summary.wonRevenue += value;
    }

    if (dealStatus === "OPEN") {
      summary.openDeals += 1;

      summary.openPipeline += value;

      summary.weightedPipeline += value * (probability / 100);
    }

    if (dealStatus === "LOST") {
      summary.lostDeals += 1;

      summary.lostValue += value;
    }

    statusMap[dealStatus] = (statusMap[dealStatus] || 0) + 1;

    if (!sourceMap[dealSource]) {
      sourceMap[dealSource] = {
        source: dealSource,
        deals: 0,
        value: 0,
        wonRevenue: 0,
      };
    }

    sourceMap[dealSource].deals += 1;

    sourceMap[dealSource].value += value;

    if (dealStatus === "WON") {
      sourceMap[dealSource].wonRevenue += value;
    }

    const assignedUserId = deal.assignedTo?._id ? String(deal.assignedTo._id) : "UNASSIGNED";

    const assignedUserName = deal.assignedTo ? deal.assignedTo.name || deal.assignedTo.email || "Unknown User" : "Unassigned";

    if (!assignedUserMap[assignedUserId]) {
      assignedUserMap[assignedUserId] = {
        userId: assignedUserId === "UNASSIGNED" ? null : assignedUserId,

        name: assignedUserName,

        email: deal.assignedTo?.email || null,

        deals: 0,

        value: 0,

        wonDeals: 0,

        wonRevenue: 0,

        openDeals: 0,

        lostDeals: 0,
      };
    }

    assignedUserMap[assignedUserId].deals += 1;

    assignedUserMap[assignedUserId].value += value;

    if (dealStatus === "WON") {
      assignedUserMap[assignedUserId].wonDeals += 1;

      assignedUserMap[assignedUserId].wonRevenue += value;
    }

    if (dealStatus === "OPEN") {
      assignedUserMap[assignedUserId].openDeals += 1;
    }

    if (dealStatus === "LOST") {
      assignedUserMap[assignedUserId].lostDeals += 1;
    }

    const companyId = deal.companyId?._id ? String(deal.companyId._id) : "UNASSIGNED";

    const companyName = deal.companyId ? deal.companyId.name || "Unknown Company" : "No Company";

    if (!companyMap[companyId]) {
      companyMap[companyId] = {
        companyId: companyId === "UNASSIGNED" ? null : companyId,

        name: companyName,

        deals: 0,

        value: 0,

        wonDeals: 0,

        wonRevenue: 0,
      };
    }

    companyMap[companyId].deals += 1;

    companyMap[companyId].value += value;

    if (dealStatus === "WON") {
      companyMap[companyId].wonDeals += 1;

      companyMap[companyId].wonRevenue += value;
    }

    const pipelineId = deal.pipelineId ? String(deal.pipelineId) : "UNASSIGNED";

    if (!pipelineMap[pipelineId]) {
      pipelineMap[pipelineId] = {
        pipelineId: pipelineId === "UNASSIGNED" ? null : pipelineId,

        deals: 0,

        value: 0,

        wonDeals: 0,

        wonRevenue: 0,

        openDeals: 0,

        openPipeline: 0,

        lostDeals: 0,

        lostValue: 0,
      };
    }

    pipelineMap[pipelineId].deals += 1;

    pipelineMap[pipelineId].value += value;

    if (dealStatus === "WON") {
      pipelineMap[pipelineId].wonDeals += 1;

      pipelineMap[pipelineId].wonRevenue += value;
    }

    if (dealStatus === "OPEN") {
      pipelineMap[pipelineId].openDeals += 1;

      pipelineMap[pipelineId].openPipeline += value;
    }

    if (dealStatus === "LOST") {
      pipelineMap[pipelineId].lostDeals += 1;

      pipelineMap[pipelineId].lostValue += value;
    }

    if (!currencyMap[currency]) {
      currencyMap[currency] = {
        currency,

        deals: 0,

        value: 0,

        wonRevenue: 0,
      };
    }

    currencyMap[currency].deals += 1;

    currencyMap[currency].value += value;

    if (dealStatus === "WON") {
      currencyMap[currency].wonRevenue += value;
    }

    const dateValue = deal.expectedCloseDate || deal.wonAt || deal.createdAt;

    if (dateValue) {
      const date = new Date(dateValue);

      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthKey,

            deals: 0,

            value: 0,

            wonDeals: 0,

            wonRevenue: 0,

            openDeals: 0,

            openPipeline: 0,

            lostDeals: 0,

            lostValue: 0,
          };
        }

        monthlyMap[monthKey].deals += 1;

        monthlyMap[monthKey].value += value;

        if (dealStatus === "WON") {
          monthlyMap[monthKey].wonDeals += 1;

          monthlyMap[monthKey].wonRevenue += value;
        }

        if (dealStatus === "OPEN") {
          monthlyMap[monthKey].openDeals += 1;

          monthlyMap[monthKey].openPipeline += value;
        }

        if (dealStatus === "LOST") {
          monthlyMap[monthKey].lostDeals += 1;

          monthlyMap[monthKey].lostValue += value;
        }
      }
    }
  });

  if (summary.totalDeals > 0) {
    summary.averageDealValue = summary.totalValue / summary.totalDeals;

    summary.averageProbability = summary.averageProbability / summary.totalDeals;

    summary.winRate = (summary.wonDeals / summary.totalDeals) * 100;

    summary.lossRate = (summary.lostDeals / summary.totalDeals) * 100;
  }

  const byStatus = Object.entries(statusMap)
    .map(([statusName, count]) => ({
      status: statusName,

      deals: count,
    }))
    .sort((a, b) => b.deals - a.deals);

  const bySource = Object.values(sourceMap).sort((a, b) => b.value - a.value);

  const byAssignedUser = Object.values(assignedUserMap)
    .map((item) => ({
      ...item,

      winRate: item.deals > 0 ? (item.wonDeals / item.deals) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const byCompany = Object.values(companyMap).sort((a, b) => b.value - a.value);

  const byPipeline = Object.values(pipelineMap).sort((a, b) => b.value - a.value);

  const currencies = Object.values(currencyMap).sort((a, b) => b.value - a.value);

  const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  return {
    filters: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: status || null,
      source: source || null,
      assignedTo: assignedTo || null,
    },

    summary,

    byStatus,

    bySource,

    byAssignedUser,

    byCompany,

    byPipeline,

    currencies,

    monthly,

    rows,
  };
};

const getActivitiesReport = async ({ businessId, dateFrom, dateTo, type, status, assignedTo }) => {
  const filter = {
    businessId,
  };

  if (type) {
    filter.type = String(type).trim().toUpperCase();
  }

  if (status) {
    filter.status = String(status).trim().toUpperCase();
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};

    if (dateFrom) {
      const from = new Date(dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw new ApiError(400, "Invalid dateFrom.");
      }

      from.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = from;
    }

    if (dateTo) {
      const to = new Date(dateTo);

      if (Number.isNaN(to.getTime())) {
        throw new ApiError(400, "Invalid dateTo.");
      }

      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const activities = await Activity.find(filter).populate("assignedTo", "name email").sort({ createdAt: -1 }).lean();

  const summary = {
    total: activities.length,
  };

  const typeMap = {};

  activities.forEach((activity) => {
    const activityType = activity?.type || "UNKNOWN";

    if (!typeMap[activityType]) {
      typeMap[activityType] = {
        type: activityType,
        count: 0,
      };
    }

    typeMap[activityType].count += 1;
  });

  const byType = Object.values(typeMap).sort((a, b) => b.count - a.count);

  const statusMap = {};

  activities.forEach((activity) => {
    const activityStatus = activity?.status || "UNKNOWN";

    if (!statusMap[activityStatus]) {
      statusMap[activityStatus] = {
        status: activityStatus,
        count: 0,
      };
    }

    statusMap[activityStatus].count += 1;
  });

  const byStatus = Object.values(statusMap).sort((a, b) => b.count - a.count);

  const assignedUserMap = {};

  activities.forEach((activity) => {
    const user = activity?.assignedTo;

    const userId = user?._id ? user._id.toString() : "UNASSIGNED";

    if (!assignedUserMap[userId]) {
      assignedUserMap[userId] = {
        assignedTo: user?._id || null,
        name: user?.name || "Unassigned",
        email: user?.email || null,
        count: 0,
      };
    }

    assignedUserMap[userId].count += 1;
  });

  const byAssignedUser = Object.values(assignedUserMap).sort((a, b) => b.count - a.count);

  const monthlyMap = {};

  activities.forEach((activity) => {
    if (!activity?.createdAt) {
      return;
    }

    const date = new Date(activity.createdAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        count: 0,
      };
    }

    monthlyMap[month].count += 1;
  });

  const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  return {
    filters: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      type: type || null,
      status: status || null,
      assignedTo: assignedTo || null,
    },

    summary,

    byType,

    byStatus,

    byAssignedUser,

    monthly,

    rows: activities,
  };
};

const update = async ({ businessId, reportId, userId, data }) => {
  const report = await Report.findOne({
    _id: reportId,
    businessId,
  });

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  if (data.name !== undefined) {
    report.name = data.name;
  }

  if (data.description !== undefined) {
    report.description = data.description;
  }

  if (data.source !== undefined) {
    if (!MODELS[data.source]) {
      throw new ApiError(400, "Invalid report source.");
    }

    report.source = data.source;
  }

  if (data.filters !== undefined) {
    report.filters = cleanFilters(data.filters);
  }

  if (data.columns !== undefined) {
    report.columns = data.columns;
  }

  if (data.groupBy !== undefined) {
    report.groupBy = data.groupBy || null;
  }

  report.updatedBy = userId;

  await report.save();

  return report;
};

const remove = async ({ businessId, reportId }) => {
  const result = await Report.deleteOne({
    _id: reportId,
    businessId,
  });

  if (!result.deletedCount) {
    throw new ApiError(404, "Report not found.");
  }

  return {
    deleted: true,
  };
};

module.exports = {
  create,
  list,
  run,

  getSalesReport,
  getLeadsReport,
  getDealsReport,
  getActivitiesReport,

  update,
  remove,
};
