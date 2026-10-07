const mongoose = require("mongoose");

const Communication = require("./communication.model");
const Integration = require("../integrations/integration.model");
const BusinessMember = require("../business-members/business-member.model");

const ApiError = require("../../utils/ApiError");

const emailService = require("../../services/email.service");
const smsService = require("../../services/sms.service");
const whatsappService = require("../../services/whatsapp.service");

const env = require("../../config/env");

const validateObjectId = (id, name = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${name}.`);
  }
};

const ensure = async (businessId, userId) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(userId, "user ID");

  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).lean();

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business.");
  }

  return member;
};

const activeIntegration = async (businessId, channel) => {
  const type = String(channel || "")
    .trim()
    .toUpperCase();

  const integration = await Integration.findOne({
    businessId,
    type,
    status: "ACTIVE",
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!integration) {
    throw new ApiError(400, `${type} integration is not active for this business.`);
  }

  return integration;
};

const getApiKey = (integration) => {
  return String(integration?.credentials?.apiKey || integration?.credentials?.api_key || integration?.config?.apiKey || integration?.config?.api_key || env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || "").trim();
};

const getSmsSender = (integration) => {
  return String(integration?.config?.sender || integration?.config?.senderName || integration?.metadata?.sender || integration?.metadata?.senderName || integration?.credentials?.sender || integration?.credentials?.senderName || process.env.BREVO_SMS_SENDER || "").trim();
};

const getWhatsAppSenderNumber = (integration) => {
  return String(
    integration?.config?.senderNumber || integration?.config?.phoneNumber || integration?.metadata?.senderNumber || integration?.metadata?.phoneNumber || integration?.credentials?.senderNumber || integration?.credentials?.phoneNumber || process.env.BREVO_WHATSAPP_SENDER_NUMBER || ""
  ).trim();
};

const getProviderMessageId = (result) => {
  if (!result) return null;

  const candidates = [result.providerMessageId, result.messageId, result.message_id, result.id, result.data?.providerMessageId, result.data?.messageId, result.data?.message_id, result.data?.id, result.raw?.providerMessageId, result.raw?.messageId, result.raw?.message_id, result.raw?.id];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
};

const getFromValue = (channel, integration, result) => {
  if (result?.from) {
    return result.from;
  }

  if (channel === "EMAIL") {
    return integration?.config?.senderEmail || integration?.config?.email || integration?.metadata?.senderEmail || integration?.metadata?.email || env.brevoEmail || null;
  }

  if (channel === "SMS") {
    return getSmsSender(integration) || null;
  }

  if (channel === "WHATSAPP") {
    return getWhatsAppSenderNumber(integration) || null;
  }

  return null;
};

const saveOutbound = async ({ businessId, channel, provider, providerMessageId, to, from, subject, body, relatedTo, metadata = {}, createdBy, status = "SENT", errorMessage = null }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "created by user ID");

  if (providerMessageId) {
    const existing = await Communication.findOne({
      businessId,
      channel,
      providerMessageId: String(providerMessageId),
      direction: "OUTBOUND",
    });

    if (existing) {
      if (status && existing.status !== "DELIVERED") {
        existing.status = status;
      }

      if (errorMessage !== undefined) {
        existing.errorMessage = errorMessage;
      }

      if (to) existing.to = to;
      if (from) existing.from = from;
      if (subject) existing.subject = subject;

      if (body && !existing.body) {
        existing.body = body;
      }

      existing.metadata = {
        ...(existing.metadata || {}),
        ...(metadata || {}),
      };

      await existing.save();
      return existing;
    }
  }

  return Communication.create({
    businessId,
    channel,
    direction: "OUTBOUND",
    to: to || null,
    from: from || null,
    subject: subject || null,
    body: String(body || "").slice(0, 20000),
    status,
    provider: provider || null,
    providerMessageId: providerMessageId ? String(providerMessageId) : null,
    relatedTo: relatedTo || undefined,
    metadata: metadata || {},
    errorMessage: errorMessage || null,
    createdBy,
  });
};

const send = async ({ businessId, userId, data = {} }) => {
  await ensure(businessId, userId);

  const channel = String(data.channel || "")
    .trim()
    .toUpperCase();

  if (!["EMAIL", "SMS", "WHATSAPP"].includes(channel)) {
    throw new ApiError(400, "Unsupported communication channel.");
  }

  const to = String(data.to || "").trim();
  const body = String(data.body || "").trim();

  if (!to) {
    throw new ApiError(400, "Recipient is required.");
  }

  if (!body) {
    throw new ApiError(400, "Message body is required.");
  }

  let integration;
  let result;

  try {
    integration = await activeIntegration(businessId, channel);

    if (channel === "EMAIL") {
      result = await emailService.sendEmail({
        to,
        subject: data.subject || "BR30 CRM",
        html: data.html || body.replace(/\n/g, "<br />"),
        text: body,
        senderName: data.senderName || integration.config?.senderName || integration.metadata?.senderName || "BR30 CRM",
      });
    }

    if (channel === "SMS") {
      const apiKey = getApiKey(integration);

      if (!apiKey) {
        throw new ApiError(400, "Brevo SMS API key is not configured.");
      }

      const sender = getSmsSender(integration);

      if (!sender) {
        throw new ApiError(400, "Brevo SMS sender is not configured. Set BREVO_SMS_SENDER or configure the SMS integration sender.");
      }

      result = await smsService.sendSms({
        apiKey,
        sender,
        to,
        body,
        webUrl: integration.config?.webUrl,
        tag: integration.config?.tag,
      });
    }

    if (channel === "WHATSAPP") {
      const apiKey = getApiKey(integration);

      if (!apiKey) {
        throw new ApiError(400, "Brevo WhatsApp API key is not configured.");
      }

      const senderNumber = getWhatsAppSenderNumber(integration);

      if (!senderNumber) {
        throw new ApiError(400, "Brevo WhatsApp sender number is not configured. Set BREVO_WHATSAPP_SENDER_NUMBER or configure the WhatsApp integration sender number.");
      }

      result = await whatsappService.sendWhatsApp({
        apiKey,
        senderNumber,
        to,
        body,
        templateId: data.templateId || integration.config?.templateId || integration.metadata?.templateId,
        params: data.params || {},
        mediaUrl: data.mediaUrl,
      });
    }

    const providerMessageId = getProviderMessageId(result);

    if (!providerMessageId) {
      throw new ApiError(502, `Brevo ${channel} API did not return a message ID.`);
    }

    const from = getFromValue(channel, integration, result);

    const saved = await saveOutbound({
      businessId,
      channel,
      provider: result?.provider || integration.provider || `brevo-${channel.toLowerCase()}`,
      providerMessageId,
      to: result?.to || to,
      from,
      subject: data.subject || null,
      body,
      relatedTo: data.relatedTo,
      metadata: {
        integrationId: integration._id,
        providerResponse: result?.raw || result || null,
        acceptedAt: new Date(),
      },
      createdBy: userId,
      status: "SENT",
    });

    return {
      ...saved.toObject(),
      delivered: false,
      accepted: true,
      status: "SENT",
      message: `${channel} accepted by Brevo. Delivery status will update from webhook.`,
    };
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(502, error?.message || `${channel} sending failed.`);
  }
};

const markDelivered = async ({ businessId, channel, provider, providerMessageId, to, from, subject, body, metadata = {}, createdBy, relatedTo }) => {
  if (!businessId || !providerMessageId) {
    return null;
  }

  const query = {
    businessId,
    channel: String(channel).toUpperCase(),
    providerMessageId: String(providerMessageId),
    direction: "OUTBOUND",
  };

  let communication = await Communication.findOne(query);

  if (!communication) {
    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return null;
    }

    communication = await Communication.create({
      businessId,
      channel: String(channel).toUpperCase(),
      direction: "OUTBOUND",
      to: to || null,
      from: from || null,
      subject: subject || null,
      body: String(body || "").slice(0, 20000),
      status: "DELIVERED",
      provider: provider || null,
      providerMessageId: String(providerMessageId),
      relatedTo: relatedTo || undefined,
      metadata,
      errorMessage: null,
      createdBy,
    });

    return communication;
  }

  communication.status = "DELIVERED";
  communication.errorMessage = null;

  if (provider) {
    communication.provider = provider;
  }

  if (to) {
    communication.to = to;
  }

  if (from) {
    communication.from = from;
  }

  if (subject) {
    communication.subject = subject;
  }

  if (body && !communication.body) {
    communication.body = String(body).slice(0, 20000);
  }

  communication.metadata = {
    ...(communication.metadata || {}),
    ...(metadata || {}),
    deliveredAt: new Date(),
  };

  await communication.save();

  return communication;
};

const markFailed = async ({ businessId, channel, providerMessageId, errorMessage, metadata = {} }) => {
  if (!businessId || !providerMessageId) {
    return null;
  }

  const communication = await Communication.findOne({
    businessId,
    channel: String(channel).toUpperCase(),
    providerMessageId: String(providerMessageId),
    direction: "OUTBOUND",
  });

  if (!communication) {
    return null;
  }

  communication.status = "FAILED";
  communication.errorMessage = errorMessage || `${channel} message failed.`;

  communication.metadata = {
    ...(communication.metadata || {}),
    ...(metadata || {}),
    failedAt: new Date(),
  };

  await communication.save();

  return communication;
};

const ingestInbound = async ({ businessId, channel, provider, providerMessageId, from, to, subject, body, metadata = {}, createdBy, receivedAt }) => {
  if (!businessId || !body) {
    return null;
  }

  if (providerMessageId) {
    const existing = await Communication.findOne({
      businessId,
      channel,
      providerMessageId: String(providerMessageId),
      direction: "INBOUND",
    });

    if (existing) {
      return existing;
    }
  }

  validateObjectId(createdBy, "created by user ID");

  return Communication.create({
    businessId,
    channel,
    direction: "INBOUND",
    from: from || null,
    to: to || null,
    subject: subject || null,
    body: String(body).slice(0, 20000),
    status: "RECEIVED",
    provider: provider || null,
    providerMessageId: providerMessageId ? String(providerMessageId) : null,
    metadata,
    createdBy,
    createdAt: receivedAt || undefined,
  });
};

const list = async ({ businessId, userId, page = 1, limit = 50, channel, search }) => {
  await ensure(businessId, userId);

  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 50));

  const filter = {
    businessId,
  };

  if (channel) {
    filter.channel = String(channel).trim().toUpperCase();
  }

  if (search) {
    const value = String(search).trim();

    if (value) {
      filter.$or = [
        {
          to: {
            $regex: value,
            $options: "i",
          },
        },
        {
          from: {
            $regex: value,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: value,
            $options: "i",
          },
        },
        {
          body: {
            $regex: value,
            $options: "i",
          },
        },
        {
          providerMessageId: {
            $regex: value,
            $options: "i",
          },
        },
      ];
    }
  }

  const [communications, total] = await Promise.all([
    Communication.find(filter)
      .populate("createdBy", "name email firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Communication.countDocuments(filter),
  ]);

  return {
    items: communications,
    communications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const senderAccounts = async ({ businessId, userId }) => {
  await ensure(businessId, userId);

  const integrations = await Integration.find({
    businessId,
    type: {
      $in: ["EMAIL", "SMS", "WHATSAPP"],
    },
  })
    .select("name provider type status config metadata lastConnectedAt lastSyncAt errorMessage")
    .sort({
      type: 1,
      createdAt: -1,
    })
    .lean();

  return {
    integrations,

    senders: integrations.map((item) => ({
      id: item._id,
      name: item.name,
      provider: item.provider,
      type: item.type,
      status: item.status,
      active: item.status === "ACTIVE",
      config: item.config || {},
      metadata: item.metadata || {},
      lastConnectedAt: item.lastConnectedAt,
      lastSyncAt: item.lastSyncAt,
      errorMessage: item.errorMessage,

      sender: item.type === "EMAIL" ? item.config?.senderEmail || item.config?.email || item.metadata?.senderEmail || env.brevoEmail || null : item.type === "SMS" ? getSmsSender(item) || null : getWhatsAppSenderNumber(item) || null,
    })),
  };
};

const syncAllEmail = async () => {
  return {
    success: true,
    mode: "WEBHOOK",
    message: "Email, SMS and WhatsApp delivery are handled through provider webhooks.",
  };
};

module.exports = {
  send,
  list,
  senderAccounts,
  ingestInbound,
  markDelivered,
  markFailed,
  syncAllEmail,
  activeIntegration,
};
