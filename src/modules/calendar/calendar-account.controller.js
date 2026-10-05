const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const s = require("./calendar-account.service");
const google = require("./providers/google/google-calendar.service");
const outlook = require("./providers/outlook/outlook-calendar.service");
const providers = { GOOGLE: google, OUTLOOK: outlook };
exports.list = asyncHandler(async (req, res) => ApiResponse.success(res, { accounts: await s.list({ businessId: req.params.businessId, userId: req.user.userId, provider: req.query.provider }) }, "Calendar accounts fetched successfully."));
exports.connect = asyncHandler(async (req, res) => {
  const provider = providers[req.body.provider];
  const url = provider.getAuthorizationUrl({ businessId: req.params.businessId, userId: req.user.userId });
  return ApiResponse.success(res, { provider: req.body.provider, authorizationUrl: url }, "Calendar authorization URL generated.");
});
exports.callback = asyncHandler(async (req, res) => {
  const providerName = String(req.query.provider || "").toUpperCase();
  const provider = providers[providerName];
  if (!provider) return res.status(400).json({ success: false, message: "Invalid calendar provider." });
  const result = await provider.handleCallback({ code: req.query.code, state: req.query.state });
  const account = await s.saveTokens({ businessId: result.state.businessId, userId: result.state.userId, provider: providerName, tokens: result.tokens, profile: result.profile });
  return ApiResponse.success(res, { account: await s.get({ businessId: result.state.businessId, userId: result.state.userId, accountId: account._id }) }, "Calendar account connected successfully.");
});
exports.disconnect = asyncHandler(async (req, res) => ApiResponse.success(res, { account: await s.disconnect({ businessId: req.params.businessId, userId: req.user.userId, accountId: req.params.accountId }) }, "Calendar account disconnected successfully."));
