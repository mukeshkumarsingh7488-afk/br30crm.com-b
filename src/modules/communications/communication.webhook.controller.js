const Integration = require("../integrations/integration.model");
const service = require("./communication.service");

const findIntegration = async (id, type) => {
  const filter = { _id: id, status: "ACTIVE" };
  if (type) filter.type = type;

  const i = await Integration.findOne(filter).lean();

  if (!i) {
    throw new Error("Active communication integration not found.");
  }

  return i;
};

const verifySecret = (req, integration) => {
  const expected = integration.config?.webhookSecret || integration.credentials?.webhookSecret;

  if (!expected) return true;

  const actual = req.get("x-br30-webhook-secret") || req.get("authorization")?.replace(/^Bearer\s+/i, "") || req.query.secret || req.body?.secret;

  return actual === expected;
};

const normalizedEvent = (body) =>
  String(body?.event || body?.eventName || body?.msg_status || body?.MessageStatus || body?.status || body?.description || "")
    .trim()
    .toLowerCase();

const getProviderMessageId = (body) => body?.messageId || body?.MessageId || body?.MessageSid || body?.message_id || body?.["message-id"] || body?.providerMessageId || body?.id || null;

const isDelivered = (event) => {
  const value = String(event || "")
    .toLowerCase()
    .trim();

  return ["delivered", "delivery", "delivery_success", "delivery_successful"].includes(value);
};

const isFailed = (event) => {
  const value = String(event || "")
    .toLowerCase()
    .trim();

  return ["failed", "failure", "undelivered", "rejected", "error", "hard_bounce", "soft_bounce", "blocked", "invalid_email", "spam", "blacklisted", "skip", "bounced"].includes(value);
};

exports.whatsappVerify = async (req, res) => {
  try {
    const i = await findIntegration(req.params.integrationId, "WHATSAPP");

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const expected = i.config?.verifyToken || i.credentials?.verifyToken;

    if (mode === "subscribe" && expected && token === expected) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  } catch (error) {
    console.error("WhatsApp verify error:", error.message);

    return res.sendStatus(404);
  }
};

exports.whatsapp = async (req, res) => {
  try {
    const i = await findIntegration(req.params.integrationId, "WHATSAPP");

    if (!verifySecret(req, i)) {
      return res.sendStatus(403);
    }

    const body = req.body || {};

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};

        for (const msg of value.messages || []) {
          if (msg.type !== "text") continue;

          await service.ingestInbound({
            businessId: i.businessId,
            channel: "WHATSAPP",
            provider: "brevo-whatsapp",
            providerMessageId: msg.id ? String(msg.id) : null,
            from: msg.from || null,
            to: value.metadata?.display_phone_number || i.config?.senderNumber || i.credentials?.senderNumber || null,
            body: msg.text?.body || "",
            metadata: {
              phoneNumberId: value.metadata?.phone_number_id || null,
              waContact: value.contacts?.[0] || null,
              raw: msg,
            },
            createdBy: i.createdBy,
            receivedAt: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
          });
        }

        for (const status of value.statuses || []) {
          const providerMessageId = status.id || status.messageId || status.message_id;

          if (!providerMessageId) continue;

          const state = String(status.status || status.event || status.msg_status || "")
            .trim()
            .toLowerCase();

          if (isDelivered(state)) {
            await service.markDelivered({
              businessId: i.businessId,
              channel: "WHATSAPP",
              provider: "brevo-whatsapp",
              providerMessageId: String(providerMessageId),
              to: status.recipient_id || status.to || null,
              metadata: {
                providerStatus: state,
                raw: status,
              },
              createdBy: i.createdBy,
            });

            continue;
          }

          if (isFailed(state)) {
            await service.markFailed({
              businessId: i.businessId,
              channel: "WHATSAPP",
              provider: "brevo-whatsapp",
              providerMessageId: String(providerMessageId),
              errorMessage: status.errors?.[0]?.message || status.error?.message || `WhatsApp delivery status: ${state}`,
              metadata: {
                providerStatus: state,
                raw: status,
              },
            });
          }
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook error:", error.message);

    return res.sendStatus(500);
  }
};

exports.sms = async (req, res) => {
  try {
    const i = await findIntegration(req.params.integrationId, "SMS");

    if (!verifySecret(req, i)) {
      return res.sendStatus(403);
    }

    const b = req.body || {};

    const messageId = getProviderMessageId(b);

    const state = normalizedEvent(b);

    if (messageId && isDelivered(state)) {
      await service.markDelivered({
        businessId: i.businessId,
        channel: "SMS",
        provider: "brevo-sms",
        providerMessageId: String(messageId),
        to: b.to || b.recipient || b.phone || null,
        from: i.config?.sender || i.config?.senderName || i.credentials?.sender || null,
        body: b.content || b.body || b.message || "",
        metadata: {
          providerStatus: state,
          reference: b.reference || null,
          raw: b,
        },
        createdBy: i.createdBy,
      });

      return res.status(200).type("text/plain").send("OK");
    }

    if (messageId && isFailed(state)) {
      await service.markFailed({
        businessId: i.businessId,
        channel: "SMS",
        provider: "brevo-sms",
        providerMessageId: String(messageId),
        errorMessage: b.description || b.reason || `SMS delivery status: ${state}`,
        metadata: {
          providerStatus: state,
          raw: b,
        },
      });

      return res.status(200).type("text/plain").send("OK");
    }

    if (b.MessageSid && b.Body) {
      await service.ingestInbound({
        businessId: i.businessId,
        channel: "SMS",
        provider: "brevo-sms",
        providerMessageId: String(b.MessageSid),
        from: b.From || null,
        to: b.To || i.config?.sender || i.credentials?.sender || null,
        body: b.Body,
        metadata: {
          raw: b,
        },
        createdBy: i.createdBy,
      });
    }

    return res.status(200).type("text/plain").send("OK");
  } catch (error) {
    console.error("SMS webhook error:", error.message);

    return res.sendStatus(500);
  }
};

exports.emailGeneric = async (req, res) => {
  try {
    const i = await findIntegration(req.params.integrationId, "EMAIL");

    if (!verifySecret(req, i)) {
      return res.sendStatus(403);
    }

    const b = req.body || {};

    const event = normalizedEvent(b);

    const providerMessageId = getProviderMessageId(b);

    if (providerMessageId && isDelivered(event)) {
      await service.markDelivered({
        businessId: i.businessId,
        channel: "EMAIL",
        provider: "brevo-email",
        providerMessageId: String(providerMessageId),
        to: b.email || b.to || b.recipient || null,
        from: i.config?.senderEmail || i.config?.email || i.credentials?.senderEmail || null,
        subject: b.subject || b.Subject || null,
        body: b.body || b.text || b.textContent || "",
        metadata: {
          providerStatus: event,
          raw: b,
        },
        createdBy: i.createdBy,
      });

      return res.status(200).json({ success: true });
    }

    if (providerMessageId && isFailed(event)) {
      await service.markFailed({
        businessId: i.businessId,
        channel: "EMAIL",
        provider: "brevo-email",
        providerMessageId: String(providerMessageId),
        errorMessage: b.reason || b.description || `Email delivery status: ${event}`,
        metadata: {
          providerStatus: event,
          raw: b,
        },
      });

      return res.status(200).json({ success: true });
    }

    const from = b.from || b.sender || b.From;

    const to = b.to || b.recipient || b.To;

    const body = b.body || b.text || b.textContent || b.message;

    if (!from || !body) {
      return res.status(200).json({ success: true });
    }

    await service.ingestInbound({
      businessId: i.businessId,
      channel: "EMAIL",
      provider: i.provider || "brevo-email",
      providerMessageId: providerMessageId ? String(providerMessageId) : null,
      from,
      to,
      subject: b.subject || b.Subject || null,
      body,
      metadata: {
        source: "provider-webhook",
        rawProvider: i.provider || "brevo-email",
        raw: b,
      },
      createdBy: i.createdBy,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email webhook error:", error.message);

    return res.sendStatus(500);
  }
};
