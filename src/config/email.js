const env = require("./env");

const sendEmail = async (options = {}) => {
  try {
    if (!env.brevoEmail || !env.brevoSmtpKey) {
      throw new Error("Brevo configuration missing.");
    }

    const normalizeEmails = (input) => {
      if (!input) return [];

      if (typeof input === "object" && !Array.isArray(input) && input.email) {
        return [
          {
            email: String(input.email).trim(),
            name: input.name ? String(input.name).trim() : undefined,
          },
        ].filter((item) => item.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email));
      }

      const rawList = Array.isArray(input) ? input : String(input).split(",");

      return rawList
        .flatMap((item) => {
          if (!item) return [];

          if (typeof item === "string") {
            return item.split(",").map((email) => ({
              email: email.trim(),
            }));
          }

          if (typeof item === "object" && item.email) {
            return [
              {
                email: String(item.email).trim(),
                name: item.name ? String(item.name).trim() : undefined,
              },
            ];
          }

          return [];
        })
        .filter((item) => item.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email))
        .filter((item, index, self) => index === self.findIndex((x) => x.email.toLowerCase() === item.email.toLowerCase()));
    };

    const toList = normalizeEmails(options.to || options.email);
    const ccList = normalizeEmails(options.cc);
    const bccList = normalizeEmails(options.bcc);

    if (!toList.length && !ccList.length && !bccList.length) {
      throw new Error("Recipient email is required.");
    }

    const payload = {
      sender: {
        name: options.senderName || "BR30 CRM",
        email: env.brevoEmail.trim(),
      },
      subject: options.subject || "BR30 CRM",
      htmlContent: options.html || options.message || "",
    };

    if (toList.length) payload.to = toList;
    if (ccList.length) payload.cc = ccList;
    if (bccList.length) payload.bcc = bccList;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": env.brevoSmtpKey.trim(),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseData = await response.json().catch(() => null);

    if (response.ok) {
        return responseData;
    }

    throw new Error(responseData?.message || "Brevo API rejected the email request.");
  } catch (error) {
    console.error("❌ Brevo API email failed:", error.message);

    throw new Error(error.message || "Email sending failed.");
  }
};

module.exports = {
  sendEmail,
};
