const { AsyncLocalStorage } = require("async_hooks");
const storage = new AsyncLocalStorage();
const runWithAutomationContext = (context, fn) => storage.run(context, fn);
const getAutomationContext = () => storage.getStore() || null;
module.exports = { runWithAutomationContext, getAutomationContext };
