const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "BREVO_EMAIL", "BREVO_SMTP_KEY", "CLOUD_NAME", "CLOUD_API_KEY", "CLOUD_API_SECRET", "MASTER_ADMIN_USER_ID"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  appName: process.env.APP_NAME || "BR30 CRM",
  appUrl: process.env.APP_URL || "http://localhost:5000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  frontendUrls: String(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),

  mongodbUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "24h",

  masterAdminUserId: process.env.MASTER_ADMIN_USER_ID.trim(),

  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",

  logLevel: process.env.LOG_LEVEL || "info",

  brevoEmail: process.env.BREVO_EMAIL,
  brevoSmtpKey: process.env.BREVO_SMTP_KEY,

  brevoSmsSender: process.env.BREVO_SMS_SENDER || "BR30",
  brevoWhatsAppSenderNumber: process.env.BREVO_WHATSAPP_SENDER_NUMBER || "",

  smtpHost: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  smtpPort: Number(process.env.SMTP_PORT) || 587,

  publicFormBaseUrl: process.env.PUBLIC_FORM_BASE_URL || process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173",

  socialWebhookSecret: process.env.SOCIAL_WEBHOOK_SECRET || "",

  cloudinary: {
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
    apiSecret: process.env.CLOUD_API_SECRET,
  },
};

module.exports = env;
