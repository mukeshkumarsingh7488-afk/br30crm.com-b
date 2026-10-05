const CalendarSync = require("./calendar-sync.model");
const CalendarAccount = require("./calendar-account.model");
const accountService = require("./calendar-account.service");
const ApiError = require("../../utils/ApiError");
const ensureAccount = async (accountId, businessId, userId) => {
  const account = await CalendarAccount.findOne({ _id: accountId, businessId, userId });
  if (!account) throw new ApiError(404, "Calendar account not found.");
  return account;
};
const getSync = async ({ accountId, businessId, userId }) => {
  await ensureAccount(accountId, businessId, userId);
  return CalendarSync.findOne({ accountId, businessId }).lean();
};
const start = async ({ accountId, businessId, userId, direction = "BIDIRECTIONAL" }) => {
  const account = await ensureAccount(accountId, businessId, userId);
  let sync = await CalendarSync.findOne({ accountId, businessId });
  if (!sync) sync = await CalendarSync.create({ businessId, accountId, direction, createdBy: userId });
  sync.status = "RUNNING";
  sync.startedAt = new Date();
  sync.lastError = null;
  sync.updatedBy = userId;
  await sync.save();
  try {
    const tokens = await accountService.tokens(account);
    if (!tokens.accessToken) throw new Error("Calendar access token is unavailable. Reconnect the account.");
    sync.status = "COMPLETED";
    sync.completedAt = new Date();
    account.lastSyncAt = new Date();
    account.status = "CONNECTED";
    account.lastSyncError = null;
    await Promise.all([sync.save(), account.save()]);
    return sync;
  } catch (error) {
    sync.status = "FAILED";
    sync.completedAt = new Date();
    sync.lastError = error.message;
    account.status = "ERROR";
    account.lastSyncError = error.message;
    await Promise.all([sync.save(), account.save()]);
    throw new ApiError(502, `Calendar sync failed: ${error.message}`);
  }
};
module.exports = { getSync, start };
