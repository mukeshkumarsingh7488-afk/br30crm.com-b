const crypto = require("crypto");
const Webhook = require("./webhook.model");
const WebhookDelivery = require("./webhook-delivery.model");
const { enqueue } = require("../../jobs/job.service");
const ApiError = require("../../utils/ApiError");

const sign = (secretHash, body) => crypto.createHmac("sha256", secretHash).update(body).digest("hex");
const queueEvent = async (event, payload) => {
  if (!payload?.businessId) return 0;
  const webhooks = await Webhook.find({ businessId: payload.businessId, status: "ACTIVE", $or: [{ events: event.toLowerCase() }, { events: "*" }] }).lean();
  for (const webhook of webhooks) {
    const delivery = await WebhookDelivery.create({ businessId: webhook.businessId, webhookId: webhook._id, event: event.toLowerCase(), payload, status: "PENDING" });
    await enqueue("WEBHOOK_DELIVERY", { deliveryId: delivery._id.toString() }, { maxAttempts: webhook.retryEnabled ? webhook.maxRetries + 1 : 1 });
  }
  return webhooks.length;
};
const deliver = async (deliveryId) => {
  const delivery = await WebhookDelivery.findById(deliveryId);
  if (!delivery) throw new Error("Webhook delivery not found");
  const webhook = await Webhook.findOne({ _id: delivery.webhookId, businessId: delivery.businessId });
  if (!webhook || webhook.status !== "ACTIVE") throw new Error("Webhook is not active");
  const body = JSON.stringify({ id: delivery._id.toString(), event: delivery.event, timestamp: new Date().toISOString(), data: delivery.payload });
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), webhook.timeoutMs || 10000);
  delivery.attempts += 1;
  delivery.status = "PENDING";
  await delivery.save();
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { ...(webhook.headers || {}), "Content-Type": "application/json", "X-BR30-Event": delivery.event, "X-BR30-Delivery": delivery._id.toString(), "X-BR30-Signature": sign(webhook.secretHash, body) },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    delivery.httpStatus = response.status;
    delivery.responseMs = Date.now() - started;
    delivery.responseBody = (await response.text()).slice(0, 5000);
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    delivery.status = "SUCCESS";
    delivery.deliveredAt = new Date();
    delivery.error = null;
    await delivery.save();
    await Webhook.updateOne({ _id: webhook._id }, { $set: { lastDeliveredAt: new Date(), lastError: null }, $unset: { lastFailedAt: 1 } });
    return true;
  } catch (error) {
    clearTimeout(timeout);
    delivery.status = "FAILED";
    delivery.error = error.name === "AbortError" ? "Webhook request timed out" : error.message;
    delivery.responseMs = Date.now() - started;
    await delivery.save();
    await Webhook.updateOne({ _id: webhook._id }, { $set: { lastFailedAt: new Date(), lastError: delivery.error } });
    throw error;
  }
};
const listDeliveries = async ({ businessId, webhookId, status, page = 1, limit = 20 }) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const filter = { businessId };
  if (webhookId) filter.webhookId = webhookId;
  if (status) filter.status = status;
  const [deliveries, total] = await Promise.all([
    WebhookDelivery.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WebhookDelivery.countDocuments(filter),
  ]);
  return { deliveries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
module.exports = { queueEvent, deliver, listDeliveries };
