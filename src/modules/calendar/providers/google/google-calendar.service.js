const crypto = require("crypto");
const env = require("../../../../config/env");
const stateSecret = crypto.createHash("sha256").update(`${env.jwtAccessSecret}:google-calendar-state`).digest();
const config = () => ({ clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID, clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET, redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${env.appUrl}/api/v1/calendar-accounts/callback` });
const signState = (payload) => {
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", stateSecret).update(raw).digest("base64url");
  return `${raw}.${sig}`;
};
const verifyState = (state) => {
  const [raw, sig] = String(state || "").split(".");
  if (!raw || !sig) throw new Error("Invalid OAuth state.");
  const expected = crypto.createHmac("sha256", stateSecret).update(raw).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error("Invalid OAuth state signature.");
  return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
};
const getAuthorizationUrl = ({ businessId, userId }) => {
  const c = config();
  if (!c.clientId || !c.clientSecret) throw new Error("Google Calendar OAuth is not configured. Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET.");
  const state = signState({ businessId, userId, provider: "GOOGLE", createdAt: Date.now() });
  const params = new URLSearchParams({ client_id: c.clientId, redirect_uri: c.redirectUri, response_type: "code", access_type: "offline", prompt: "consent", scope: "openid email profile https://www.googleapis.com/auth/calendar", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};
const handleCallback = async ({ code, state }) => {
  if (!code) throw new Error("Google authorization code is required.");
  const c = config();
  const verified = verifyState(state);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: c.redirectUri, grant_type: "authorization_code" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token exchange failed.");
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${data.access_token}` } });
  const profile = await profileResponse.json();
  return { state: verified, tokens: { accessToken: data.access_token, refreshToken: data.refresh_token || null, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null, scope: data.scope || null }, profile: { id: profile.sub, email: profile.email, name: profile.name } };
};
const refreshAccessToken = async ({ refreshToken }) => {
  const c = config();
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token refresh failed.");
  return data;
};
module.exports = { getAuthorizationUrl, handleCallback, refreshAccessToken };
