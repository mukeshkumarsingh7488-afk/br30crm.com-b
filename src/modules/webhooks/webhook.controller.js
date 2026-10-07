const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const webhookService = require("./webhook.service");

const createWebhook = asyncHandler(async (req, res) => {
  const result = await webhookService.createWebhook({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, result, "Webhook created successfully. Store the webhook secret securely because it will not be shown again.");
});

const getWebhooksByBusiness = asyncHandler(async (req, res) => {
  const result = await webhookService.getWebhooksByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    event: req.query.event,
  });

  return ApiResponse.success(res, result, "Business webhooks fetched successfully.");
});

const getWebhookById = asyncHandler(async (req, res) => {
  const webhook = await webhookService.getWebhookById(req.params.webhookId, req.params.businessId);

  return ApiResponse.success(res, { webhook }, "Webhook fetched successfully.");
});

const updateWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhookService.updateWebhook(req.params.webhookId, req.params.businessId, req.body, req.user.userId);

  return ApiResponse.success(res, { webhook }, "Webhook updated successfully.");
});

const regenerateWebhookSecret = asyncHandler(async (req, res) => {
  const result = await webhookService.regenerateWebhookSecret(req.params.webhookId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, result, "Webhook secret regenerated successfully. Store the new secret securely.");
});

const testWebhook = asyncHandler(async (req, res) => {
  const result = await webhookService.testWebhook(req.params.webhookId, req.params.businessId, req.user.userId);
  return ApiResponse.success(res, result, "Webhook test queued successfully.");
});

const getDeliveries = asyncHandler(async (req, res) => {
  const result = await webhookService.getDeliveries({ businessId: req.params.businessId, webhookId: req.params.webhookId, status: req.query.status, page: req.query.page, limit: req.query.limit });
  return ApiResponse.success(res, result, "Webhook deliveries fetched successfully.");
});

const retryDelivery = asyncHandler(async (req, res) => {
  const result = await webhookService.retryDelivery(req.params.deliveryId, req.params.businessId);
  return ApiResponse.success(res, result, "Webhook delivery retry queued successfully.");
});
const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await webhookService.getDeliveryById(req.params.deliveryId, req.params.businessId);
  return ApiResponse.success(res, { delivery }, "Webhook delivery fetched successfully.");
});

const deleteWebhook = asyncHandler(async (req, res) => {
  const result = await webhookService.deleteWebhook(req.params.webhookId, req.params.businessId, req.user.userId);

  return ApiResponse.success(res, result, "Webhook deleted successfully.");
});

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
};
