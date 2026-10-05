const crypto = require("crypto");
const env = require("../../../../config/env");
const stateSecret = crypto.createHash("sha256").update(`${env.jwtAccessSecret}:outlook-calendar-state`).digest();
const config = () => ({ clientId: process.env.MICROSOFT_CALENDAR_CLIENT_ID, clientSecret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET, redirectUri: process.env.MICROSOFT_CALENDAR_REDIRECT_URI || `${env.appUrl}/api/v1/calendar-accounts/callback` });
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
  if (!c.clientId || !c.clientSecret) throw new Error("Microsoft Calendar OAuth is not configured. Set MICROSOFT_CALENDAR_CLIENT_ID and MICROSOFT_CALENDAR_CLIENT_SECRET.");
  const state = signState({ businessId, userId, provider: "OUTLOOK", createdAt: Date.now() });
  const params = new URLSearchParams({ client_id: c.clientId, response_type: "code", redirect_uri: c.redirectUri, response_mode: "query", scope: "openid profile email offline_access Calendars.ReadWrite", state });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
};
const handleCallback = async ({ code, state }) => {
  if (!code) throw new Error("Microsoft authorization code is required.");
  const c = config();
  const verified = verifyState(state);
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, code, redirect_uri: c.redirectUri, grant_type: "authorization_code", scope: "openid profile email offline_access Calendars.ReadWrite" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Microsoft token exchange failed.");
  const me = await fetch("https://graph.microsoft.com/v1.0/me", { headers: { Authorization: `Bearer ${data.access_token}` } });
  const profile = await me.json();
  return {
    state: verified,
    tokens: { accessToken: data.access_token, refreshToken: data.refresh_token || null, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null, scope: data.scope || null },
    profile: { id: profile.id, email: profile.mail || profile.userPrincipalName, name: profile.displayName },
  };
};
const refreshAccessToken = async ({ refreshToken }) => {
  const c = config();
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token", scope: "openid profile email offline_access Calendars.ReadWrite" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Microsoft token refresh failed.");
  return data;
};
module.exports = { getAuthorizationUrl, handleCallback, refreshAccessToken };
