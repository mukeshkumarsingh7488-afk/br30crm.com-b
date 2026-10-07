const crypto = require("crypto");
const { enqueue } = require("../../jobs/job.service");
const WebhookDelivery = require("./webhook-delivery.model");

const Webhook = require("./webhook.model");
const Business = require("../businesses/business.model");

const ApiError = require("../../utils/ApiError");

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id.toString())) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
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

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) {
    return [];
  }

  return [...new Set(events.filter((event) => typeof event === "string" && event.trim()).map((event) => event.trim().toLowerCase()))];
};

const generateWebhookSecret = () => {
  return `br30_wh_${crypto.randomBytes(32).toString("hex")}`;
};

const hashWebhookSecret = (secret) => {
  return crypto.createHash("sha256").update(secret).digest("hex");
};

const sanitizeWebhook = (webhook) => {
  if (!webhook) {
    return webhook;
  }

  const result = {
    ...webhook,
  };

  delete result.secretHash;

  return result;
};

const createWebhook = async ({ businessId, name, url, events, status, headers, retryEnabled, maxRetries, timeoutMs, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  const normalizedEvents = normalizeEvents(events);

  if (!normalizedEvents.length) {
    throw new ApiError(400, "At least one webhook event is required.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new ApiError(400, "Invalid webhook URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ApiError(400, "Webhook URL must use HTTP or HTTPS.");
  }

  const secret = generateWebhookSecret();
  const secretHash = hashWebhookSecret(secret);
  const secretPrefix = secret.substring(0, 15);

  const webhook = await Webhook.create({
    businessId,
    name: name.trim(),
    url: parsedUrl.toString(),
    events: normalizedEvents,
    status: status || "INACTIVE",
    secretPrefix,
    secretHash,
    headers: headers && typeof headers === "object" ? headers : {},
    retryEnabled: retryEnabled !== undefined ? Boolean(retryEnabled) : true,
    maxRetries: maxRetries !== undefined ? Number(maxRetries) : 3,
    timeoutMs: timeoutMs !== undefined ? Number(timeoutMs) : 10000,
    createdBy,
  });

  const result = await Webhook.findOne({
    _id: webhook._id,
    businessId,
  })
    .select("-secretHash")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  return {
    webhook: sanitizeWebhook(result),
    secret,
  };
};

const getWebhooksByBusiness = async (businessId, { page = 1, limit = 10, search, status, event } = {}) => {
  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

  if (status) {
    filter.status = status;
  }

  if (event) {
    filter.events = event.trim().toLowerCase();
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
        url: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([Webhook.find(filter).select("-secretHash").populate("createdBy", "name email").populate("updatedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Webhook.countDocuments(filter)]);

  return {
    webhooks: webhooks.map(sanitizeWebhook),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getWebhookById = async (webhookId, businessId) => {
  validateObjectId(webhookId, "webhook ID");

  await getBusiness(businessId);

  const webhook = await Webhook.findOne({
    _id: webhookId,
    businessId,
  })
    .select("-secretHash")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!webhook) {
    throw new ApiError(404, "Webhook not found.");
  }

  return sanitizeWebhook(webhook);
};

const updateWebhook = async (webhookId, businessId, updates, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(webhookId, "webhook ID");
  validateObjectId(updatedBy, "updated by user ID");

  const webhook = await Webhook.findOne({
    _id: webhookId,
    businessId,
  });

  if (!webhook) {
    throw new ApiError(404, "Webhook not found.");
  }

  if (updates.name !== undefined) {
    webhook.name = updates.name.trim();
  }

  if (updates.url !== undefined) {
    let parsedUrl;

    try {
      parsedUrl = new URL(updates.url);
    } catch (error) {
      throw new ApiError(400, "Invalid webhook URL.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new ApiError(400, "Webhook URL must use HTTP or HTTPS.");
    }

    webhook.url = parsedUrl.toString();
  }

  if (updates.events !== undefined) {
    const normalizedEvents = normalizeEvents(updates.events);

    if (!normalizedEvents.length) {
      throw new ApiError(400, "At least one webhook event is required.");
    }

    webhook.events = normalizedEvents;
  }

  if (updates.status !== undefined) {
    webhook.status = updates.status;

    if (updates.status === "ACTIVE") {
      webhook.lastError = null;
    }
  }

  if (updates.headers !== undefined) {
    webhook.headers = updates.headers && typeof updates.headers === "object" ? updates.headers : {};
  }

  if (updates.retryEnabled !== undefined) {
    webhook.retryEnabled = Boolean(updates.retryEnabled);
  }

  if (updates.maxRetries !== undefined) {
    webhook.maxRetries = Number(updates.maxRetries);
  }

  if (updates.timeoutMs !== undefined) {
    webhook.timeoutMs = Number(updates.timeoutMs);
  }

  webhook.updatedBy = updatedBy;

  await webhook.save();

  return getWebhookById(webhookId, businessId);
};

const regenerateWebhookSecret = async (webhookId, businessId, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(webhookId, "webhook ID");
  validateObjectId(updatedBy, "updated by user ID");

  const webhook = await Webhook.findOne({
    _id: webhookId,
    businessId,
  });

  if (!webhook) {
    throw new ApiError(404, "Webhook not found.");
  }

  const secret = generateWebhookSecret();

  webhook.secretHash = hashWebhookSecret(secret);
  webhook.secretPrefix = secret.substring(0, 15);
  webhook.updatedBy = updatedBy;

  await webhook.save();

  return {
    webhook: await getWebhookById(webhookId, businessId),
    secret,
  };
};

const deleteWebhook = async (webhookId, businessId, deletedBy) => {
  await getBusiness(businessId);

  validateObjectId(webhookId, "webhook ID");
  validateObjectId(deletedBy, "deleted by user ID");

  const webhook = await Webhook.findOne({
    _id: webhookId,
    businessId,
  });

  if (!webhook) {
    throw new ApiError(404, "Webhook not found.");
  }

  await Webhook.findByIdAndDelete(webhookId);

  return {
    id: webhookId,
    deleted: true,
  };
};

const testWebhook = async (webhookId, businessId, actorId) => {
  await getBusiness(businessId);
  validateObjectId(webhookId, "webhook ID");
  validateObjectId(actorId, "user ID");
  const webhook = await Webhook.findOne({ _id: webhookId, businessId });
  if (!webhook) throw new ApiError(404, "Webhook not found.");
  const delivery = await WebhookDelivery.create({ businessId, webhookId, event: "webhook.test", status: "PENDING", payload: { test: true, businessId, webhookId, triggeredBy: actorId, timestamp: new Date().toISOString() } });
  await enqueue("WEBHOOK_DELIVERY", { deliveryId: delivery._id.toString() }, { maxAttempts: 1 });
  return { deliveryId: delivery._id, queued: true };
};
const retryDelivery = async (deliveryId, businessId) => {
  await getBusiness(businessId);
  validateObjectId(deliveryId, "delivery ID");
  const delivery = await WebhookDelivery.findOne({ _id: deliveryId, businessId });
  if (!delivery) throw new ApiError(404, "Webhook delivery not found.");
  const webhook = await Webhook.findOne({ _id: delivery.webhookId, businessId });
  if (!webhook) throw new ApiError(404, "Webhook not found.");
  delivery.status = "PENDING";
  delivery.error = null;
  await delivery.save();
  await enqueue("WEBHOOK_DELIVERY", { deliveryId: delivery._id.toString() }, { maxAttempts: webhook.retryEnabled ? webhook.maxRetries + 1 : 1 });
  return { deliveryId: delivery._id, queued: true };
};
const getDeliveryById = async (deliveryId, businessId) => {
  await getBusiness(businessId);
  validateObjectId(deliveryId, "delivery ID");
  const delivery = await WebhookDelivery.findOne({ _id: deliveryId, businessId }).lean();
  if (!delivery) throw new ApiError(404, "Webhook delivery not found.");
  return delivery;
};
const getDeliveries = async ({ businessId, webhookId, status, page = 1, limit = 20 }) => {
  await getBusiness(businessId);
  validateObjectId(webhookId, "webhook ID");
  return require("./webhook-delivery.service").listDeliveries({ businessId, webhookId, status, page, limit });
};

module.exports = {
  createWebhook,
  getWebhooksByBusiness,
  getWebhookById,
  updateWebhook,
  regenerateWebhookSecret,
  deleteWebhook,
  testWebhook,
  getDeliveries,
  retryDelivery,
  getDeliveryById,
  hashWebhookSecret,
};
