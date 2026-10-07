const env = require("../config/env");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const normalizeEmails = (input) => {
  if (!input) return [];

  if (typeof input === "object" && !Array.isArray(input) && input.email) {
    return [
      {
        email: String(input.email).trim(),
        ...(input.name ? { name: String(input.name).trim() } : {}),
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
            ...(item.name ? { name: String(item.name).trim() } : {}),
          },
        ];
      }

      return [];
    })
    .filter((item) => item.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email))
    .filter((item, index, self) => index === self.findIndex((x) => x.email.toLowerCase() === item.email.toLowerCase()));
};

const sendEmail = async ({ to, cc, bcc, subject, html, text, senderName }) => {
  try {
    const apiKey = String(env.brevoSmtpKey || process.env.BREVO_SMTP_KEY || env.brevoApiKey || "").trim();

    const senderEmail = String(env.brevoEmail || "").trim();

    if (!apiKey) {
      throw new Error("Brevo SMTP API key is not configured.");
    }

    if (!senderEmail) {
      throw new Error("Brevo sender email is not configured.");
    }

    const toList = normalizeEmails(to);
    const ccList = normalizeEmails(cc);
    const bccList = normalizeEmails(bcc);

    if (!toList.length && !ccList.length && !bccList.length) {
      throw new Error("Recipient email is required.");
    }

    const payload = {
      sender: {
        name: senderName || env.appName || "BR30 CRM",
        email: senderEmail,
      },
      subject: subject || "BR30 CRM",
      htmlContent: html || "",
    };

    if (text) payload.textContent = text;
    if (toList.length) payload.to = toList;
    if (ccList.length) payload.cc = ccList;
    if (bccList.length) payload.bcc = bccList;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;

    try {
      response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Brevo Email API request timed out.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(responseData?.message || responseData?.code || `Brevo API rejected the email request (${response.status}).`);
    }

    const providerMessageId = responseData?.messageId || responseData?.message_id || responseData?.id || null;

    if (!providerMessageId) {
      throw new Error("Brevo EMAIL API did not return a message ID.");
    }

    return {
      provider: "brevo-email",
      providerMessageId: String(providerMessageId),
      accepted: true,
      raw: responseData,
      to: toList.map((item) => item.email).join(", "),
      from: senderEmail,
    };
  } catch (error) {
    throw new Error(error.message || "Email sending failed.");
  }
};

module.exports = {
  sendEmail,
};

const emailHeader = `
  <div style="background:#111827;padding:26px 30px;text-align:center;border-radius:14px 14px 0 0;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:800;line-height:1.2;color:#ffffff;letter-spacing:.2px;">BR30 CRM</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;line-height:1.4;color:#cbd5e1;margin-top:6px;letter-spacing:.4px;">Business Workspace</div>
  </div>
`;

const sendVerificationOtpEmail = async ({ email, name, otp, expiresInMinutes = 10 }) => {
  const subject = `${env.appName || "BR30 CRM"} - Verify your email`;

  const text = [
    `Hello ${name || "there"},`,
    "",
    `Welcome to BR30 CRM.`,
    "",
    `Your email verification OTP is: ${otp}`,
    "",
    `This OTP will expire in ${expiresInMinutes} minutes.`,
    "",
    "For your security, do not share this OTP with anyone.",
    "",
    "If you did not create this account, you can safely ignore this email.",
    "",
    "Regards,",
    "BR30 CRM",
    "Business Workspace",
    "",
    "This is an automated message from BR30 CRM.",
    "Please do not reply directly to this email.",
    "",
    "© 2026 BR30 CRM. All rights reserved.",
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="width:100%;padding:36px 16px;box-sizing:border-box;background:#ffffff;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,.10);overflow:hidden;border:1px solid #e5e7eb;">
          ${emailHeader}

          <div style="padding:36px 34px;background:#ffffff;">
            <div style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Email Verification</div>

            <h1 style="margin:0 0 12px;font-size:27px;line-height:1.25;color:#111827;font-weight:800;">Verify your email address</h1>

            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4b5563;">Hello ${name || "there"}, welcome to BR30 CRM. Please use the verification code below to confirm your email address.</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">Verification Code</div>
              <div style="font-size:34px;font-weight:800;letter-spacing:9px;color:#111827;line-height:1.2;">${otp}</div>
            </div>

            <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:13px 15px;margin:22px 0;color:#7c2d12;font-size:13px;line-height:1.6;">This verification code will expire in <strong>${expiresInMinutes} minutes</strong>.</div>

            <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#4b5563;">For your security, never share this code with anyone.</p>

            <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">If you did not create this account, you can safely ignore this email.</p>
          </div>

          <div style="padding:22px 34px;background:#f8fafc;border-top:1px solid #e5e7eb;">
            <div style="font-size:13px;color:#64748b;line-height:1.7;">
              Regards,<br>
              <strong style="color:#111827;">BR30 CRM</strong><br>
              Business Workspace
            </div>

            <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

            <div style="font-size:12px;color:#94a3b8;line-height:1.7;text-align:center;">
              This is an automated message from <strong style="color:#64748b;">BR30 CRM</strong>.<br>
              Please do not reply directly to this email.<br><br>
              © 2026 BR30 CRM. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

const sendPasswordResetOtpEmail = async ({ email, name, otp, expiresInMinutes = 10 }) => {
  const subject = `${env.appName || "BR30 CRM"} - Password reset OTP`;

  const text = [
    `Hello ${name || "there"},`,
    "",
    `We received a request to reset your BR30 CRM password.`,
    "",
    `Your password reset OTP is: ${otp}`,
    "",
    `This OTP will expire in ${expiresInMinutes} minutes.`,
    "",
    "For your security, do not share this OTP with anyone.",
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "Regards,",
    "BR30 CRM",
    "Business Workspace",
    "",
    "This is an automated message from BR30 CRM.",
    "Please do not reply directly to this email.",
    "",
    "© 2026 BR30 CRM. All rights reserved.",
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="width:100%;padding:36px 16px;box-sizing:border-box;background:#ffffff;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,.10);overflow:hidden;border:1px solid #e5e7eb;">
          ${emailHeader}

          <div style="padding:36px 34px;background:#ffffff;">
            <div style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;">Account Security</div>

            <h1 style="margin:0 0 12px;font-size:27px;line-height:1.25;color:#111827;font-weight:800;">Reset your password</h1>

            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4b5563;">Hello ${name || "there"}, we received a request to reset the password for your BR30 CRM account.</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">Password Reset Code</div>
              <div style="font-size:34px;font-weight:800;letter-spacing:9px;color:#111827;line-height:1.2;">${otp}</div>
            </div>

            <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:13px 15px;margin:22px 0;color:#7c2d12;font-size:13px;line-height:1.6;">This password reset code will expire in <strong>${expiresInMinutes} minutes</strong>.</div>

            <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#4b5563;">For your security, never share this code with anyone.</p>

            <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>

          <div style="padding:22px 34px;background:#f8fafc;border-top:1px solid #e5e7eb;">
            <div style="font-size:13px;color:#64748b;line-height:1.7;">
              Regards,<br>
              <strong style="color:#111827;">BR30 CRM</strong><br>
              Business Workspace
            </div>

            <div style="height:1px;background:#e2e8f0;margin:18px 0;"></div>

            <div style="font-size:12px;color:#94a3b8;line-height:1.7;text-align:center;">
              This is an automated message from <strong style="color:#64748b;">BR30 CRM</strong>.<br>
              Please do not reply directly to this email.<br><br>
              © 2026 BR30 CRM. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
};
