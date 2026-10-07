const BREVO_API_URL = "https://api.brevo.com/v3";

const env = require("../../../config/env");

const getApiKey = () => String(env.brevoApiKey || process.env.BREVO_SMTP_KEY || "").trim();

const request = async (method, endpoint, payload = undefined, query = undefined) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Brevo API key is not configured.");
  }

  const url = new URL(`${BREVO_API_URL}${endpoint}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },

      ...(payload === undefined
        ? {}
        : {
            body: JSON.stringify(payload),
          }),

      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || data?.error?.message || data?.error || `Brevo request failed (${response.status}).`);
    }

    return data || {};
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Brevo API request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const sendConversationMessage = async ({ visitorId, text, agentId, agentEmail, agentName, receivedFrom }) => {
  if (!visitorId) {
    throw new Error("Brevo Conversations visitor ID is required.");
  }

  if (!text) {
    throw new Error("Conversation message is required.");
  }

  const payload = {
    visitorId,
    text,
  };

  if (agentId) {
    payload.agentId = String(agentId);
  } else if (agentEmail && agentName && receivedFrom) {
    Object.assign(payload, {
      agentEmail,
      agentName,
      receivedFrom,
    });
  } else {
    throw new Error("Brevo Conversations agentId or agent identity is required.");
  }

  const data = await request("POST", "/conversations/messages", payload);

  return {
    provider: "brevo-conversations",
    providerMessageId: data?.id ? String(data.id) : null,
    visitorId,
    raw: data,
  };
};

const sendPushedMessage = async ({ visitorId, text, groupId, agentId }) => {
  if (!visitorId) {
    throw new Error("Brevo Conversations visitor ID is required.");
  }

  if (!text) {
    throw new Error("Conversation message is required.");
  }

  const payload = {
    visitorId,
    text,
  };

  if (groupId) {
    payload.groupId = String(groupId);
  } else if (agentId) {
    payload.agentId = String(agentId);
  } else {
    throw new Error("Brevo Conversations groupId or agentId is required.");
  }

  const data = await request("POST", "/conversations/pushedMessages", payload);

  return {
    provider: "brevo-conversations",
    providerMessageId: data?.id ? String(data.id) : null,
    visitorId,
    raw: data,
  };
};

const getConversationMessage = async (id) => request("GET", `/conversations/messages/${encodeURIComponent(id)}`);

const getPushedMessage = async (id) => request("GET", `/conversations/pushedMessages/${encodeURIComponent(id)}`);

const sendEmail = async (payload) => {
  const data = await request("POST", "/smtp/email", payload);

  return {
    provider: "brevo-email",
    providerMessageId: data?.messageId ? String(data.messageId) : null,

    raw: data,

    accepted: true,
  };
};

const sendSms = async (payload) => {
  const data = await request("POST", "/transactionalSMS/send", payload);

  return {
    provider: "brevo-sms",

    providerMessageId: data?.messageId ? String(data.messageId) : null,

    raw: data,

    accepted: true,
  };
};

const sendWhatsApp = async (payload) => {
  const data = await request("POST", "/whatsapp/sendMessage", payload);

  return {
    provider: "brevo-whatsapp",

    providerMessageId: data?.messageId ? String(data.messageId) : null,

    raw: data,

    accepted: true,
  };
};

const getWhatsAppStatistics = async (query) => request("GET", "/whatsapp/statistics/events", undefined, query);

const getWebhooks = async () => request("GET", "/webhooks");

module.exports = {
  request,

  sendEmail,
  sendSms,
  sendWhatsApp,

  sendConversationMessage,
  sendPushedMessage,

  getConversationMessage,
  getPushedMessage,

  getWhatsAppStatistics,
  getWebhooks,
};
