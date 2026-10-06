const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

const runWithRequestContext = (context, fn) => storage.run(context, fn);
const getRequestContext = () => storage.getStore() || null;

module.exports = {
  runWithRequestContext,
  getRequestContext,
};
