const env = require("../config/env");

const BREVO_WHATSAPP_URL = "https://api.brevo.com/v3/whatsapp/sendMessage";

const getApiKey = () => String(env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || "").trim();

const request = async (payload) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Brevo WhatsApp API key is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(BREVO_WHATSAPP_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || data?.code || `Brevo WhatsApp request failed (${response.status}).`);
    }

    return data || {};
  } finally {
    clearTimeout(timeout);
  }
};

const sendWhatsApp = async ({ apiKey, senderNumber, to, body, templateId, params, mediaUrl }) => {
  const key = String(apiKey || env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || "").trim();

  if (!key) {
    throw new Error("Brevo WhatsApp API key is not configured.");
  }

  if (!senderNumber) {
    throw new Error("Brevo WhatsApp sender number is not configured for this business.");
  }

  const phone = String(to || "").replace(/[^\d+]/g, "");

  if (!phone) {
    throw new Error("Recipient WhatsApp number is required.");
  }

  if (!body && !templateId && !mediaUrl) {
    throw new Error("WhatsApp message is required.");
  }

  const payload = {
    senderNumber: String(senderNumber).trim(),
    contactNumbers: [phone],
  };

  if (templateId) {
    payload.templateId = Number(templateId);
    payload.params = params || {};
  } else {
    payload.text = String(body || "");
  }

  if (mediaUrl) {
    payload.mediaUrl = mediaUrl;
  }

  const result = await request(payload);

  const providerMessageId = result?.messageId || result?.message_id || result?.id || null;

  if (!providerMessageId) {
    throw new Error("Brevo WhatsApp API did not return a message ID.");
  }

  return {
    provider: "brevo-whatsapp",
    providerMessageId: String(providerMessageId),
    accepted: true,
    raw: result,
    to: phone,
    from: String(senderNumber).trim(),
  };
};

module.exports = {
  sendWhatsApp,
};
