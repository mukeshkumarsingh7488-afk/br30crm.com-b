const mongoose = require("mongoose");

const PublicForm = require("./public-form.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Lead = require("../leads/lead.model");
const LeadSource = require("../lead-sources/lead-source.model");

const ApiError = require("../../utils/ApiError");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const getBusiness = async (businessId) => {
  if (!validId(businessId)) {
    throw new ApiError(400, "Invalid business ID.");
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  })
    .select("_id ownerId name status")
    .lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  return business;
};

const ensureMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business.");
  }

  return member;
};

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

const normalizeCode = (value, fallback = "") =>
  String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);

const normalizeFields = (fields = []) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new ApiError(400, "At least one public form field is required.");
  }

  const keys = new Set();

  return fields.map((field, index) => {
    const key = String(field.key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80);

    if (!key) {
      throw new ApiError(400, "Every public form field requires a valid key.");
    }

    if (keys.has(key)) {
      throw new ApiError(400, `Duplicate public form field key: ${key}`);
    }

    keys.add(key);

    const label = String(field.label || key)
      .trim()
      .slice(0, 120);

    const type = field.type || "text";

    const allowedTypes = ["name", "text", "email", "phone", "number", "textarea", "select", "date"];

    if (!allowedTypes.includes(type)) {
      throw new ApiError(400, `Invalid public form field type: ${type}`);
    }

    const options = Array.isArray(field.options)
      ? field.options
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 100)
      : [];

    if (type === "select" && !options.length) {
      throw new ApiError(400, `Select field "${label}" requires options.`);
    }

    return {
      key,
      label,
      type,
      required: Boolean(field.required),
      options,
      placeholder: String(field.placeholder || "")
        .trim()
        .slice(0, 200),
      helpText: String(field.helpText || "")
        .trim()
        .slice(0, 500),
      order: Number.isFinite(Number(field.order)) ? Number(field.order) : index,
    };
  });
};

const validateRedirectUrl = (value) => {
  if (!value) return null;

  try {
    const url = new URL(String(value));

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    return url.toString();
  } catch {
    throw new ApiError(400, "redirectUrl must be a valid HTTP/HTTPS URL.");
  }
};

const getPublicBaseUrl = () => {
  const configured = process.env.PUBLIC_FORM_BASE_URL || process.env.publicFormBaseUrl || "";

  return String(configured).replace(/\/+$/, "");
};

const buildPublicUrl = ({ businessId, slug }) => {
  const baseUrl = getPublicBaseUrl();

  if (!baseUrl) {
    throw new ApiError(500, "Public form base URL is not configured.");
  }

  return `${baseUrl}/public/forms/${businessId}/${slug}`;
};

const buildEmbedCode = (publicUrl) => {
  return `<iframe src="${publicUrl}" title="Lead form" style="width:100%;min-height:600px;border:0;" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
};

const getTrackingData = (metadata = {}) => {
  const query = metadata.query && typeof metadata.query === "object" ? metadata.query : {};

  return {
    source: query.utm_source || query.source || query.lead_source || null,

    sourceId: query.source_id || null,

    medium: query.utm_medium || query.medium || null,

    campaign: query.utm_campaign || query.campaign || query.lead_campaign || null,

    campaignId: query.campaign_id || null,

    term: query.utm_term || query.term || null,

    content: query.utm_content || query.content || null,

    referrer: metadata.referrer || null,

    origin: metadata.origin || null,

    ip: metadata.ip || null,

    userAgent: metadata.userAgent || null,
  };
};

const resolveLeadSourceTracking = async ({ businessId, tracking = {}, form = null }) => {
  const sourceId = tracking.sourceId && validId(tracking.sourceId) ? tracking.sourceId : null;
  const campaignId = tracking.campaignId && validId(tracking.campaignId) ? tracking.campaignId : null;

  let sourceRecord = null;
  let campaignRecord = null;

  if (sourceId) {
    sourceRecord = await LeadSource.findOne({
      _id: sourceId,
      businessId,
      type: "SOURCE",
      active: true,
    })
      .select("_id name code type medium active")
      .lean();

    if (!sourceRecord) {
      throw new ApiError(400, "Unable to identify the selected source.");
    }
  }

  if (campaignId) {
    campaignRecord = await LeadSource.findOne({
      _id: campaignId,
      businessId,
      type: "CAMPAIGN",
      active: true,
    })
      .select("_id name code type medium active")
      .lean();

    if (!campaignRecord) {
      throw new ApiError(400, "Unable to identify the selected campaign.");
    }
  }

  const source = sourceRecord?.code || sourceRecord?.name || tracking.source || form?.source || "website";

  const campaign = campaignRecord?.code || campaignRecord?.name || tracking.campaign || form?.campaign || null;

  const medium = sourceRecord?.medium || campaignRecord?.medium || tracking.medium || null;

  return {
    source,
    sourceId: sourceRecord?._id || null,
    sourceName: sourceRecord?.name || null,
    sourceCode: sourceRecord?.code || null,
    sourceType: sourceRecord?.type || null,

    campaign,
    campaignId: campaignRecord?._id || null,
    campaignName: campaignRecord?.name || null,
    campaignCode: campaignRecord?.code || null,
    campaignType: campaignRecord?.type || null,

    medium,

    term: tracking.term || null,
    content: tracking.content || null,
    referrer: tracking.referrer || null,
    origin: tracking.origin || null,
    ip: tracking.ip || null,
    userAgent: tracking.userAgent || null,
  };
};

const getFormForManagement = async ({ businessId, userId, formId }) => {
  await getBusiness(businessId);
  await ensureMember(businessId, userId);

  if (!validId(formId)) {
    throw new ApiError(400, "Invalid form ID.");
  }

  const form = await PublicForm.findOne({
    _id: formId,
    businessId,
  });

  if (!form) {
    throw new ApiError(404, "Public form not found.");
  }

  return form;
};

const createForm = async ({ businessId, userId, data }) => {
  await getBusiness(businessId);
  await ensureMember(businessId, userId);

  const name = String(data.name || "").trim();

  if (!name) {
    throw new ApiError(400, "Form name is required.");
  }

  const slug = normalizeSlug(data.slug || name);

  if (!slug) {
    throw new ApiError(400, "A valid form slug is required.");
  }

  const exists = await PublicForm.exists({
    businessId,
    slug,
  });

  if (exists) {
    throw new ApiError(409, "A public form with this slug already exists.");
  }

  const fields = normalizeFields(data.fields);

  const redirectUrl = validateRedirectUrl(data.redirectUrl);

  const form = await PublicForm.create({
    businessId,
    name,
    slug,
    description: data.description || "",
    purpose: data.purpose === "SUPPORT" ? "SUPPORT" : "LEAD",
    fields,
    source: normalizeCode(data.source, "website"),
    campaign: data.campaign === undefined || data.campaign === null || data.campaign === "" ? null : String(data.campaign).trim(),

    successMessage: data.successMessage || "Thank you. We will contact you shortly.",

    redirectUrl,

    status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",

    spamProtection: data.spamProtection !== false,

    settings: data.settings && typeof data.settings === "object" ? data.settings : {},

    createdBy: userId,
    updatedBy: userId,
  });

  const publicUrl = buildPublicUrl({
    businessId,
    slug,
  });

  return {
    ...form.toObject(),
    publicUrl,
    embedCode: buildEmbedCode(publicUrl),
  };
};

const listForms = async ({ businessId, userId, query = {} }) => {
  await getBusiness(businessId);
  await ensureMember(businessId, userId);

  const filter = {
    businessId,
  };

  if (query.status === "ACTIVE" || query.status === "INACTIVE") {
    filter.status = query.status;
  }

  if (query.search) {
    const search = String(query.search).trim();

    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: search,
          $options: "i",
        },
      },
      {
        source: {
          $regex: search,
          $options: "i",
        },
      },
      {
        campaign: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const forms = await PublicForm.find(filter).sort({ createdAt: -1 }).lean();

  return forms.map((form) => {
    const publicUrl = buildPublicUrl({
      businessId,
      slug: form.slug,
    });

    return {
      ...form,
      publicUrl,
      embedCode: buildEmbedCode(publicUrl),
    };
  });
};

const updateForm = async ({ businessId, userId, formId, data }) => {
  const form = await getFormForManagement({
    businessId,
    userId,
    formId,
  });

  if (data.name !== undefined) {
    const name = String(data.name).trim();

    if (!name) {
      throw new ApiError(400, "Form name cannot be empty.");
    }

    form.name = name;
  }

  if (data.slug !== undefined) {
    const slug = normalizeSlug(data.slug);

    if (!slug) {
      throw new ApiError(400, "A valid form slug is required.");
    }

    if (slug !== form.slug) {
      const exists = await PublicForm.exists({
        businessId,
        slug,
        _id: { $ne: form._id },
      });

      if (exists) {
        throw new ApiError(409, "A public form with this slug already exists.");
      }
    }

    form.slug = slug;
  }

  if (data.description !== undefined) {
    form.description = data.description || "";
  }

  if (data.purpose !== undefined) {
    form.purpose = data.purpose === "SUPPORT" ? "SUPPORT" : "LEAD";
  }

  if (data.fields !== undefined) {
    form.fields = normalizeFields(data.fields);
  }

  if (data.source !== undefined) {
    form.source = normalizeCode(data.source, "website");
  }

  if (data.campaign !== undefined) {
    form.campaign = data.campaign === null || data.campaign === "" ? null : String(data.campaign).trim();
  }

  if (data.successMessage !== undefined) {
    form.successMessage = data.successMessage || "Thank you. We will contact you shortly.";
  }

  if (data.redirectUrl !== undefined) {
    form.redirectUrl = validateRedirectUrl(data.redirectUrl);
  }

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new ApiError(400, "Invalid form status.");
    }

    form.status = data.status;
  }

  if (data.spamProtection !== undefined) {
    form.spamProtection = Boolean(data.spamProtection);
  }

  if (data.settings !== undefined) {
    if (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) {
      throw new ApiError(400, "settings must be an object.");
    }

    form.settings = data.settings;
  }

  form.updatedBy = userId;

  await form.save();

  const publicUrl = buildPublicUrl({
    businessId,
    slug: form.slug,
  });

  return {
    ...form.toObject(),
    publicUrl,
    embedCode: buildEmbedCode(publicUrl),
  };
};

const getPublicForm = async ({ businessId, slug, tracking = {} }) => {
  if (!validId(businessId)) {
    throw new ApiError(400, "Invalid business ID.");
  }

  const normalizedSlug = normalizeSlug(slug);

  /*
   * Public form loading is a critical public request. Keep the two
   * required reads parallel and do not block the response on analytics.
   * The previous sequential business lookup + form lookup + awaited
   * view update could hold the browser request for the full client timeout.
   */
  const [form, business] = await Promise.all([
    PublicForm.findOne({
      businessId,
      slug: normalizedSlug,
      status: "ACTIVE",
    })
      .select("-createdBy -updatedBy -settings.internal")
      .maxTimeMS(8000)
      .lean(),
    Business.findOne({
      _id: businessId,
      status: "ACTIVE",
    })
      .select("_id name status")
      .maxTimeMS(8000)
      .lean(),
  ]);

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  if (!form) {
    throw new ApiError(404, "Public form not found or inactive.");
  }

  const trackingData = getTrackingData(tracking);

  /*
   * Analytics must never delay the public form response. If the analytics
   * write is temporarily unavailable, the form still opens normally.
   */
  void PublicForm.updateOne(
    { _id: form._id },
    {
      $inc: {
        "stats.views": 1,
      },
      $set: {
        "stats.lastViewedAt": new Date(),
      },
    },
    { maxTimeMS: 3000 }
  ).catch(() => {});

  const publicUrl = buildPublicUrl({
    businessId,
    slug: form.slug,
  });

  return {
    ...form,
    businessName: business.name || "Contact",
    publicUrl,
    embedCode: buildEmbedCode(publicUrl),
    tracking: {
      source: trackingData.source || form.source || null,
      sourceId: trackingData.sourceId || null,
      medium: trackingData.medium || null,
      campaign: trackingData.campaign || form.campaign || null,
      campaignId: trackingData.campaignId || null,
      term: trackingData.term || null,
      content: trackingData.content || null,
    },
  };
};

const validateSubmissionFields = ({ form, payload }) => {
  for (const field of form.fields) {
    const value = payload[field.key];

    if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
      throw new ApiError(400, `${field.label} is required.`);
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    const stringValue = String(value).trim();

    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(stringValue)) {
        throw new ApiError(400, `${field.label} must be a valid email address.`);
      }
    }

    if (field.type === "name") {
      const nameRegex = /^[\p{L}\s.'-]+$/u;

      if (!nameRegex.test(stringValue)) {
        throw new ApiError(400, `${field.label} can contain letters, spaces, apostrophes, dots, and hyphens only.`);
      }
    }

    if (field.type === "number" && value !== undefined && value !== null && value !== "") {
      if (Number.isNaN(Number(value))) {
        throw new ApiError(400, `${field.label} must be a number.`);
      }
    }

    if (field.type === "select" && !field.options.includes(stringValue)) {
      throw new ApiError(400, `${field.label} contains an invalid option.`);
    }

    if (field.type === "date" && Number.isNaN(new Date(stringValue).getTime())) {
      throw new ApiError(400, `${field.label} must be a valid date.`);
    }
  }
};

const normalizePhone = (phone) => {
  if (!phone) return null;

  return String(phone).trim().replace(/\s+/g, " ");
};

const normalizeEmail = (email) => {
  if (!email) return null;

  return String(email).trim().toLowerCase();
};

const getLeadIdentity = (payload) => {
  const email = normalizeEmail(payload.email);

  const phone = normalizePhone(payload.phone);

  return {
    email,
    phone,
  };
};

const findExistingLead = async ({ businessId, email, phone }) => {
  const conditions = [];

  if (email) {
    conditions.push({
      email: email.toLowerCase(),
    });
  }

  if (phone) {
    conditions.push({
      phone,
    });
  }

  if (!conditions.length) {
    return null;
  }

  return Lead.findOne({
    businessId,
    $or: conditions,
  });
};

const buildLeadPayload = async ({ businessId, form, payload, metadata, owner }) => {
  const firstName = payload.firstName || payload.first_name || null;

  const lastName = payload.lastName || payload.last_name || null;

  const name = payload.name || [firstName, lastName].filter(Boolean).join(" ") || null;

  const identity = getLeadIdentity(payload);

  const tracking = await resolveLeadSourceTracking({
    businessId,
    tracking: getTrackingData(metadata),
    form,
  });

  return {
    businessId,

    firstName,

    lastName,

    name,

    email: identity.email,

    phone: identity.phone,

    companyName: payload.companyName || payload.company || null,

    jobTitle: payload.jobTitle || null,

    source: tracking.source || form.source || "website",

    status: "NEW",

    rating: "WARM",

    description: payload.message || payload.description || null,

    customFields: {
      ...payload,

      _leadGeneration: {
        formId: form._id.toString(),
        formName: form.name,
        formSlug: form.slug,
        formPurpose: form.purpose || "LEAD",
        isSupportTicket: (form.purpose || "LEAD") === "SUPPORT",

        source: tracking.source || null,

        sourceId: tracking.sourceId || null,

        sourceName: tracking.sourceName || null,

        sourceCode: tracking.sourceCode || null,

        sourceType: tracking.sourceType || null,

        medium: tracking.medium || null,

        campaign: tracking.campaign || null,

        campaignId: tracking.campaignId || null,

        campaignName: tracking.campaignName || null,

        campaignCode: tracking.campaignCode || null,

        campaignType: tracking.campaignType || null,

        term: tracking.term || null,

        content: tracking.content || null,

        referrer: tracking.referrer || null,

        origin: tracking.origin || null,

        ip: tracking.ip || null,

        userAgent: tracking.userAgent || null,

        submittedAt: new Date().toISOString(),
      },
    },

    createdBy: owner,
  };
};

const submitForm = async ({ businessId, slug, data, metadata = {} }) => {
  const business = await getBusiness(businessId);

  const form = await PublicForm.findOne({
    businessId,
    slug: normalizeSlug(slug),
    status: "ACTIVE",
  });

  if (!form) {
    throw new ApiError(404, "Public form not found or inactive.");
  }

  const payload = data && typeof data === "object" && !Array.isArray(data) ? data : {};

  /*
   * Basic honeypot support.
   *
   * Frontend can render a hidden field called
   * _website. Real users should leave it empty.
   */
  if (form.spamProtection && payload._website) {
    throw new ApiError(400, "Unable to process this submission.");
  }

  validateSubmissionFields({
    form,
    payload,
  });

  const tracking = await resolveLeadSourceTracking({
    businessId,
    tracking: getTrackingData(metadata),
    form,
  });

  const identity = getLeadIdentity(payload);

  /*
   * Prevent obvious duplicate submissions.
   */
  const existingLead = await findExistingLead({
    businessId,
    email: identity.email,
    phone: identity.phone,
  });

  let lead;
  let duplicate = false;

  if (existingLead) {
    duplicate = true;
    lead = existingLead;

    const leadGeneration = existingLead.customFields && existingLead.customFields._leadGeneration ? existingLead.customFields._leadGeneration : {};

    const updatedCustomFields = {
      ...(existingLead.customFields || {}),
      _lastPublicFormSubmission: {
        formId: form._id.toString(),
        formName: form.name,
        submittedAt: new Date().toISOString(),
      },

      _leadGeneration: {
        ...leadGeneration,

        formId: form._id.toString(),

        formName: form.name,

        formSlug: form.slug,
        formPurpose: form.purpose || leadGeneration.formPurpose || "LEAD",
        isSupportTicket: (form.purpose || leadGeneration.formPurpose || "LEAD") === "SUPPORT",

        source: tracking.source || leadGeneration.source || null,

        sourceId: tracking.sourceId || leadGeneration.sourceId || null,

        sourceName: tracking.sourceName || leadGeneration.sourceName || null,

        sourceCode: tracking.sourceCode || leadGeneration.sourceCode || null,

        sourceType: tracking.sourceType || leadGeneration.sourceType || null,

        medium: tracking.medium || leadGeneration.medium || null,

        campaign: tracking.campaign || leadGeneration.campaign || null,

        campaignId: tracking.campaignId || leadGeneration.campaignId || null,

        campaignName: tracking.campaignName || leadGeneration.campaignName || null,

        campaignCode: tracking.campaignCode || leadGeneration.campaignCode || null,

        campaignType: tracking.campaignType || leadGeneration.campaignType || null,

        term: tracking.term || leadGeneration.term || null,

        content: tracking.content || leadGeneration.content || null,

        referrer: tracking.referrer || leadGeneration.referrer || null,

        origin: tracking.origin || leadGeneration.origin || null,
      },
    };

    existingLead.customFields = updatedCustomFields;

    await existingLead.save();
  } else {
    const leadPayload = await buildLeadPayload({
      businessId,
      form,
      payload,
      metadata,
      owner: business.ownerId,
    });

    console.log("PUBLIC FORM LEAD PAYLOAD:", JSON.stringify(leadPayload, null, 2));

    lead = await Lead.create(leadPayload);

    console.log("PUBLIC FORM LEAD CREATED:", lead._id);
  }

  await PublicForm.updateOne(
    { _id: form._id },
    {
      $inc: {
        "stats.submissions": 1,
      },
      $set: {
        "stats.lastSubmittedAt": new Date(),
      },
    }
  );

  return {
    leadId: lead._id,

    formId: form._id,

    duplicate,

    supportTicket: form.purpose === "SUPPORT" ? lead.customFields?._supportTicket || null : null,

    successMessage: form.successMessage,

    redirectUrl: form.redirectUrl || null,

    attribution: {
      purpose: form.purpose || "LEAD",
      formName: form.name,
      formSlug: form.slug,
      source: tracking.source || null,
      sourceId: tracking.sourceId || null,
      sourceName: tracking.sourceName || null,
      sourceCode: tracking.sourceCode || null,
      sourceType: tracking.sourceType || null,

      medium: tracking.medium || null,

      campaign: tracking.campaign || null,
      campaignId: tracking.campaignId || null,
      campaignName: tracking.campaignName || null,
      campaignCode: tracking.campaignCode || null,
      campaignType: tracking.campaignType || null,

      term: tracking.term || null,
      content: tracking.content || null,
      referrer: tracking.referrer || null,
    },
  };
};

const getQrData = async ({ businessId, slug }) => {
  const form = await PublicForm.findOne({
    businessId,
    slug: normalizeSlug(slug),
  })
    .select("_id name slug status")
    .lean();

  if (!form) {
    throw new ApiError(404, "Public form not found.");
  }

  const publicUrl = buildPublicUrl({
    businessId,
    slug: form.slug,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(publicUrl)}`;

  return {
    formId: form._id,
    name: form.name,
    slug: form.slug,
    status: form.status,

    publicUrl,

    qrImageUrl,

    downloadUrl: qrImageUrl,

    shareUrl: publicUrl,
  };
};

const deleteForm = async ({ businessId, userId, formId }) => {
  const form = await getFormForManagement({
    businessId,
    userId,
    formId,
  });

  await PublicForm.deleteOne({
    _id: form._id,
    businessId,
  });

  return {
    id: form._id,
    name: form.name,
    slug: form.slug,
    deleted: true,
  };
};

module.exports = {
  createForm,
  listForms,
  updateForm,
  deleteForm,
  getPublicForm,
  submitForm,
  getQrData,
};
