const mongoose = require("mongoose");

const LeadAttribution = require("./lead-attribution.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Lead = require("../leads/lead.model");
const PublicForm = require("../public-forms/public-form.model");
const LeadSource = require("../lead-sources/lead-source.model");

const ApiError = require("../../utils/ApiError");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const ensureBusiness = async (businessId, userId) => {
  if (!validId(businessId)) {
    throw new ApiError(400, "Invalid business ID.");
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  if (userId) {
    const member = await BusinessMember.exists({
      businessId,
      userId,
      status: "ACTIVE",
    });

    if (!member) {
      throw new ApiError(403, "You are not an active member of this business.");
    }
  }

  return business;
};

const ensureLead = async (businessId, leadId) => {
  if (!validId(leadId)) {
    throw new ApiError(400, "Invalid lead ID.");
  }

  const lead = await Lead.findOne({
    _id: leadId,
    businessId,
  })
    .select("_id businessId")
    .lean();

  if (!lead) {
    throw new ApiError(404, "Lead not found.");
  }

  return lead;
};

const ensureForm = async (businessId, formId) => {
  if (!formId) return null;

  if (!validId(formId)) {
    throw new ApiError(400, "Invalid form ID.");
  }

  const form = await PublicForm.findOne({
    _id: formId,
    businessId,
  })
    .select("_id businessId name slug source campaign")
    .lean();

  if (!form) {
    throw new ApiError(404, "Public form not found.");
  }

  return form;
};

const resolveSource = async (businessId, sourceId, source) => {
  if (sourceId) {
    if (!validId(sourceId)) {
      throw new ApiError(400, "Invalid source ID.");
    }

    const sourceRecord = await LeadSource.findOne({
      _id: sourceId,
      businessId,
      type: "SOURCE",
    })
      .select("_id name code active")
      .lean();

    if (!sourceRecord) {
      throw new ApiError(404, "Lead source not found.");
    }

    return {
      sourceId: sourceRecord._id,
      source: sourceRecord.code || sourceRecord.name,
    };
  }

  return {
    sourceId: null,
    source: source ? String(source).trim().toLowerCase() : null,
  };
};

const resolveCampaign = async (businessId, campaignId, campaign) => {
  if (campaignId) {
    if (!validId(campaignId)) {
      throw new ApiError(400, "Invalid campaign ID.");
    }

    const campaignRecord = await LeadSource.findOne({
      _id: campaignId,
      businessId,
      type: "CAMPAIGN",
    })
      .select("_id name code active")
      .lean();

    if (!campaignRecord) {
      throw new ApiError(404, "Campaign not found.");
    }

    return {
      campaignId: campaignRecord._id,
      campaign: campaignRecord.name || campaignRecord.code,
    };
  }

  return {
    campaignId: null,
    campaign: campaign ? String(campaign).trim() : null,
  };
};

const ensureLeadFirstTouch = async ({ businessId, userId, leadId, lead }) => {
  const existing = await LeadAttribution.find({
    businessId,
    leadId,
    attributionType: "FIRST_TOUCH",
  })
    .sort({ capturedAt: 1, createdAt: 1 })
    .lean();

  if (existing.length > 0) {
    const [first, ...duplicates] = existing;

    if (duplicates.length) {
      await LeadAttribution.deleteMany({
        _id: { $in: duplicates.map((item) => item._id) },
        businessId,
        leadId,
        attributionType: "FIRST_TOUCH",
      });
    }

    return first;
  }

  return LeadAttribution.create({
    businessId,
    leadId,
    source: String(lead?.source || "manual").trim().toLowerCase() || "manual",
    attributionType: "FIRST_TOUCH",
    touchType: "FIRST",
    capturedAt: lead?.createdAt || new Date(),
    createdBy: userId || lead?.createdBy || null,
  });
};

const normalizePayload = async ({ businessId, data = {} }) => {
  const sourceResult = await resolveSource(businessId, data.sourceId, data.source);

  const campaignResult = await resolveCampaign(businessId, data.campaignId, data.campaign);

  return {
    sourceId: sourceResult.sourceId,
    source: sourceResult.source,

    campaignId: campaignResult.campaignId,
    campaign: campaignResult.campaign,

    medium: data.medium ? String(data.medium).trim().toLowerCase() : null,

    term: data.term ? String(data.term).trim() : null,

    content: data.content ? String(data.content).trim() : null,

    referrer: data.referrer ? String(data.referrer).trim() : null,

    landingPage: data.landingPage ? String(data.landingPage).trim() : null,

    landingUrl: data.landingUrl ? String(data.landingUrl).trim() : null,

    userAgent: data.userAgent ? String(data.userAgent).trim() : null,

    ipAddress: data.ipAddress ? String(data.ipAddress).trim() : null,

    trackingId: data.trackingId ? String(data.trackingId).trim() : null,

    qrCodeId: data.qrCodeId || null,

    touchType: data.touchType || "FORM",

    attributionType: data.attributionType || "FORM_SUBMISSION",

    metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
  };
};

exports.create = async ({ businessId, userId, leadId, data }) => {
  await ensureBusiness(businessId, userId);
  await ensureLead(businessId, leadId);

  const form = await ensureForm(businessId, data?.formId);

  const payload = await normalizePayload({
    businessId,
    data: {
      ...data,
      source: data?.source || form?.source || null,
      campaign: data?.campaign || form?.campaign || null,
    },
  });

  return LeadAttribution.create({
    businessId,
    leadId,
    formId: form?._id || data?.formId || null,
    ...payload,
    createdBy: userId || null,
    capturedAt: data?.capturedAt ? new Date(data.capturedAt) : new Date(),
  });
};

exports.listByLead = async ({ businessId, userId, leadId }) => {
  await ensureBusiness(businessId, userId);
  const lead = await ensureLead(businessId, leadId);
  await ensureLeadFirstTouch({ businessId, userId, leadId, lead });

  return LeadAttribution.find({
    businessId,
    leadId,
  })
    .populate("formId", "name slug")
    .populate("sourceId", "name code type")
    .populate("campaignId", "name code type")
    .sort({ capturedAt: 1 })
    .lean();
};

exports.getLeadAttribution = async ({ businessId, userId, leadId }) => {
  await ensureBusiness(businessId, userId);
  const lead = await ensureLead(businessId, leadId);
  await ensureLeadFirstTouch({ businessId, userId, leadId, lead });

  const records = await LeadAttribution.find({
    businessId,
    leadId,
  })
    .populate("formId", "name slug")
    .populate("sourceId", "name code type")
    .populate("campaignId", "name code type")
    .sort({ capturedAt: 1 })
    .lean();

  const firstTouch = records.find((item) => item.attributionType === "FIRST_TOUCH") || null;

  const lastTouch = [...records].reverse().find((item) => item.attributionType === "LAST_TOUCH") || firstTouch || null;

  return {
    firstTouch,
    lastTouch,
    totalTouches: records.length,
    records,
  };
};

exports.update = async ({ businessId, userId, attributionId, data }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(attributionId)) {
    throw new ApiError(400, "Invalid attribution ID.");
  }

  const item = await LeadAttribution.findOne({
    _id: attributionId,
    businessId,
  });

  if (!item) {
    throw new ApiError(404, "Lead attribution not found.");
  }

  const payload = await normalizePayload({
    businessId,
    data,
  });

  Object.assign(item, payload);

  if (data.formId !== undefined) {
    const form = await ensureForm(businessId, data.formId);

    item.formId = form?._id || null;
  }

  await item.save();

  return item;
};

exports.remove = async ({ businessId, userId, attributionId }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(attributionId)) {
    throw new ApiError(400, "Invalid attribution ID.");
  }

  const item = await LeadAttribution.findOneAndDelete({
    _id: attributionId,
    businessId,
  });

  if (!item) {
    throw new ApiError(404, "Lead attribution not found.");
  }

  return item;
};

exports.firstTouch = async ({ businessId, userId, leadId, data }) => {
  await ensureBusiness(businessId, userId);
  const lead = await ensureLead(businessId, leadId);
  return ensureLeadFirstTouch({ businessId, userId, leadId, lead });
};

exports.lastTouch = async ({ businessId, userId, leadId, data }) => {
  await ensureBusiness(businessId, userId);
  await ensureLead(businessId, leadId);

  return exports.create({
    businessId,
    userId,
    leadId,
    data: {
      ...data,
      attributionType: "LAST_TOUCH",
      touchType: "LAST",
    },
  });
};

exports.summary = async ({ businessId, userId, filters = {} }) => {
  await ensureBusiness(businessId, userId);

  const match = {
    businessId: new mongoose.Types.ObjectId(businessId),
  };

  if (filters.source) {
    match.source = String(filters.source).trim().toLowerCase();
  }

  if (filters.campaign) {
    match.campaign = String(filters.campaign).trim();
  }

  if (filters.formId) {
    if (!validId(filters.formId)) {
      throw new ApiError(400, "Invalid form ID.");
    }

    match.formId = new mongoose.Types.ObjectId(filters.formId);
  }

  if (filters.from || filters.to) {
    match.capturedAt = {};

    if (filters.from) {
      match.capturedAt.$gte = new Date(filters.from);
    }

    if (filters.to) {
      match.capturedAt.$lte = new Date(filters.to);
    }
  }

  const [totals, sources, campaigns] = await Promise.all([
    LeadAttribution.countDocuments(match),

    LeadAttribution.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),

    LeadAttribution.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$campaign",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total: totals,
    sources,
    campaigns,
  };
};
