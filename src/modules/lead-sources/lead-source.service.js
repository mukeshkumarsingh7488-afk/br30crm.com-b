const mongoose = require("mongoose");

const LeadSource = require("./lead-source.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const PublicForm = require("../public-forms/public-form.model");

const ApiError = require("../../utils/ApiError");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const ensure = async (businessId, userId) => {
  if (!validId(businessId)) {
    throw new ApiError(400, "Invalid business ID");
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!business) {
    throw new ApiError(404, "Active business not found");
  }

  const member = await BusinessMember.exists({
    businessId,
    userId,
    status: "ACTIVE",
  });

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return business;
};

const normalizeCode = (value, fallback) =>
  String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const normalizeMedium = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

const getBasePublicUrl = async () => {
  try {
    const env = require("../../config/env");

    return env.publicFormBaseUrl || env.frontendUrl || env.clientUrl || env.appUrl || "";
  } catch {
    return "";
  }
};

const buildTrackingParams = (item) => {
  const params = new URLSearchParams();

  const code = item.code || item.name;

  if (item.type === "CAMPAIGN") {
    params.set("utm_campaign", code);
  } else {
    params.set("utm_source", code);
  }

  if (item.medium) {
    params.set("utm_medium", normalizeMedium(item.medium));
  }

  params.set("lead_source", code);

  if (item.type === "CAMPAIGN") {
    params.set("lead_campaign", code);
  }

  return params;
};

const buildPublicFormUrl = ({ baseUrl, businessId, formSlug, params }) => {
  if (!baseUrl || !formSlug) {
    return "";
  }

  const cleanBaseUrl = String(baseUrl).replace(/\/+$/, "");

  const publicUrl = `${cleanBaseUrl}/public/forms/${businessId}/` + encodeURIComponent(formSlug);

  const query = params?.toString();

  return query ? `${publicUrl}?${query}` : publicUrl;
};

const getFormForTracking = async ({ businessId, formId, formSlug }) => {
  if (formId) {
    if (!validId(formId)) {
      throw new ApiError(400, "Invalid form ID");
    }

    const form = await PublicForm.findOne({
      _id: formId,
      businessId,
      status: "ACTIVE",
    })
      .select("_id name slug status")
      .lean();

    if (!form) {
      throw new ApiError(404, "Active public form not found.");
    }

    return form;
  }

  if (formSlug) {
    const form = await PublicForm.findOne({
      businessId,
      slug: String(formSlug).trim().toLowerCase(),
      status: "ACTIVE",
    })
      .select("_id name slug status")
      .lean();

    if (!form) {
      throw new ApiError(404, "Active public form not found.");
    }

    return form;
  }

  return null;
};

const buildTrackingResult = async ({ businessId, item, formId, formSlug, baseUrl }) => {
  const params = buildTrackingParams(item);

  if (formId) {
    params.set("form_id", String(formId));
  }

  if (item.type === "SOURCE") {
    params.set("source_id", String(item._id));
  }

  if (item.type === "CAMPAIGN") {
    params.set("campaign_id", String(item._id));
  }

  const configuredBaseUrl = String(baseUrl || (await getBasePublicUrl()) || "").trim();

  const publicUrl = buildPublicFormUrl({
    baseUrl: configuredBaseUrl,
    businessId,
    formSlug,
    params,
  });

  return {
    source: item.type === "SOURCE" ? item.code || item.name : null,
    campaign: item.type === "CAMPAIGN" ? item.code || item.name : null,
    medium: item.medium || null,
    parameters: Object.fromEntries(params.entries()),
    publicUrl,
    trackingUrl: publicUrl,
  };
};

exports.list = async ({ businessId, userId, type, active, search, formId, formSlug, baseUrl }) => {
  await ensure(businessId, userId);

  const filter = {
    businessId,
  };

  if (type) {
    filter.type = type;
  }

  if (active !== undefined) {
    filter.active = String(active) !== "false";
  }

  if (search) {
    const searchValue = String(search).trim();

    if (searchValue) {
      filter.$or = [
        {
          name: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          code: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          medium: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }
  }

  const form = await getFormForTracking({
    businessId,
    formId,
    formSlug,
  });

  const items = await LeadSource.find(filter)
    .sort({
      type: 1,
      active: -1,
      name: 1,
    })
    .lean();

  const results = [];

  for (const item of items) {
    const tracking = await buildTrackingResult({
      businessId,
      item,
      formId: form?._id,
      formSlug: form?.slug,
      baseUrl,
    });

    results.push({
      ...item,
      tracking,
      publicUrl: tracking.publicUrl,
      trackingUrl: tracking.trackingUrl,
      parameters: tracking.parameters,
      form: form
        ? {
            id: form._id,
            name: form.name,
            slug: form.slug,
            status: form.status,
          }
        : null,
    });
  }

  return results;
};

exports.create = async ({ businessId, userId, data }) => {
  await ensure(businessId, userId);

  const name = String(data.name || "").trim();

  if (!name) {
    throw new ApiError(400, "Source or campaign name is required.");
  }

  const type = data.type || "SOURCE";

  const code = normalizeCode(data.code, name);

  const existingName = await LeadSource.findOne({
    businessId,
    name,
  })
    .select("_id")
    .lean();

  if (existingName) {
    throw new ApiError(409, "A source or campaign with this name already exists.");
  }

  const existingCode = await LeadSource.findOne({
    businessId,
    code,
  })
    .select("_id")
    .lean();

  if (existingCode) {
    throw new ApiError(409, "A source or campaign with this code already exists.");
  }

  const item = await LeadSource.create({
    businessId,
    name,
    type,
    code,
    description: data.description || "",
    medium: data.medium ? normalizeMedium(data.medium) : "",
    active: data.active !== false,
    metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
    createdBy: userId,
    updatedBy: userId,
  });

  return item;
};

exports.update = async ({ businessId, userId, sourceId, data }) => {
  await ensure(businessId, userId);

  if (!validId(sourceId)) {
    throw new ApiError(400, "Invalid source ID");
  }

  const item = await LeadSource.findOne({
    _id: sourceId,
    businessId,
  });

  if (!item) {
    throw new ApiError(404, "Source or campaign not found");
  }

  if (data.name !== undefined) {
    const name = String(data.name).trim();

    if (!name) {
      throw new ApiError(400, "Source or campaign name cannot be empty.");
    }

    const duplicateName = await LeadSource.findOne({
      _id: { $ne: sourceId },
      businessId,
      name,
    })
      .select("_id")
      .lean();

    if (duplicateName) {
      throw new ApiError(409, "A source or campaign with this name already exists.");
    }

    item.name = name;
  }

  if (data.type !== undefined) {
    if (!["SOURCE", "CAMPAIGN"].includes(data.type)) {
      throw new ApiError(400, "Invalid source type.");
    }

    item.type = data.type;
  }

  if (data.code !== undefined) {
    const code = normalizeCode(data.code, item.name);

    const duplicateCode = await LeadSource.findOne({
      _id: { $ne: sourceId },
      businessId,
      code,
    })
      .select("_id")
      .lean();

    if (duplicateCode) {
      throw new ApiError(409, "A source or campaign with this code already exists.");
    }

    item.code = code;
  }

  if (data.description !== undefined) {
    item.description = String(data.description || "").trim();
  }

  if (data.medium !== undefined) {
    item.medium = normalizeMedium(data.medium);
  }

  if (data.active !== undefined) {
    item.active = data.active === true || data.active === "true";
  }

  if (data.metadata !== undefined && data.metadata !== null && typeof data.metadata === "object") {
    item.metadata = data.metadata;
  }

  item.updatedBy = userId;

  await item.save();

  return item;
};

exports.toggle = async ({ businessId, userId, sourceId }) => {
  await ensure(businessId, userId);

  if (!validId(sourceId)) {
    throw new ApiError(400, "Invalid source ID");
  }

  const item = await LeadSource.findOne({
    _id: sourceId,
    businessId,
  });

  if (!item) {
    throw new ApiError(404, "Source or campaign not found");
  }

  item.active = !item.active;
  item.updatedBy = userId;

  await item.save();

  return item;
};

exports.remove = async ({ businessId, userId, sourceId }) => {
  await ensure(businessId, userId);

  if (!validId(sourceId)) {
    throw new ApiError(400, "Invalid source ID");
  }

  const item = await LeadSource.findOne({
    _id: sourceId,
    businessId,
  });

  if (!item) {
    throw new ApiError(404, "Source or campaign not found");
  }

  await LeadSource.deleteOne({
    _id: sourceId,
    businessId,
  });

  return item;
};

exports.getTrackingLink = async ({ businessId, userId, sourceId, formId, formSlug, baseUrl }) => {
  await ensure(businessId, userId);

  if (!validId(sourceId)) {
    throw new ApiError(400, "Invalid source ID");
  }

  const item = await LeadSource.findOne({
    _id: sourceId,
    businessId,
  }).lean();

  if (!item) {
    throw new ApiError(404, "Source or campaign not found");
  }

  if (!item.active) {
    throw new ApiError(400, "This source or campaign is inactive.");
  }

  const form = await getFormForTracking({
    businessId,
    formId,
    formSlug,
  });

  if (!form) {
    throw new ApiError(400, "A public form is required to generate a tracking link.");
  }

  const tracking = await buildTrackingResult({
    businessId,
    item,
    formId: form._id,
    formSlug: form.slug,
    baseUrl,
  });

  return {
    id: item._id,
    name: item.name,
    type: item.type,
    code: item.code,
    medium: item.medium || "",
    active: item.active,
    form: {
      id: form._id,
      name: form.name,
      slug: form.slug,
      status: form.status,
    },
    publicUrl: tracking.publicUrl,
    trackingUrl: tracking.trackingUrl,
    parameters: tracking.parameters,
  };
};
