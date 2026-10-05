const env = require("../config/env");

const BREVO_SMS_URL = "https://api.brevo.com/v3/transactionalSMS/sms";

const getApiKey = () => String(env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || "").trim();

const request = async (payload) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Brevo SMS API key is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(BREVO_SMS_URL, {
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
      throw new Error(data?.message || data?.code || `Brevo SMS request failed (${response.status}).`);
    }

    return data || {};
  } finally {
    clearTimeout(timeout);
  }
};

const sendSms = async ({ apiKey, sender, to, body, webUrl, tag }) => {
  const key = String(apiKey || env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || "").trim();

  if (!key) {
    throw new Error("Brevo SMS API key is not configured.");
  }

  if (!sender) {
    throw new Error("Brevo SMS sender is not configured for this business.");
  }

  const recipient = String(to || "").replace(/[^\d+]/g, "");

  if (!recipient) {
    throw new Error("Recipient phone number is required.");
  }

  if (!body) {
    throw new Error("SMS message is required.");
  }

  const payload = {
    sender: String(sender).trim(),
    recipient,
    content: String(body),
    type: "transactional",
  };

  if (webUrl) payload.webUrl = webUrl;
  if (tag) payload.tag = tag;

  const result = await request(payload);

  const providerMessageId = result?.messageId || result?.message_id || result?.id || null;

  if (!providerMessageId) {
    throw new Error("Brevo SMS API did not return a message ID.");
  }

  return {
    provider: "brevo-sms",
    providerMessageId: String(providerMessageId),
    accepted: true,
    raw: result,
    to: recipient,
    from: String(sender).trim(),
  };
};

module.exports = {
  sendSms,
};
