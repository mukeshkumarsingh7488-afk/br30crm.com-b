const env = require("../config/env");

const REFRESH_TOKEN_COOKIE = "ucrm_refresh_token";

const getRefreshCookieOptions = () => {
  const sameSite = String(env.cookieSameSite || "lax")
    .trim()
    .toLowerCase();

  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: ["strict", "lax", "none"].includes(sameSite) ? sameSite : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
};

const getRefreshTokenFromCookie = (req) => {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] || null;
};

module.exports = {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
};
