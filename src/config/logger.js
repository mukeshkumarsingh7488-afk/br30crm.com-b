const env = require("./env");

const logger = {
  info: (...args) => {
    if (env.logLevel !== "silent") {
      console.log("[INFO]", ...args);
    }
  },

  warn: (...args) => {
    console.warn("[WARN]", ...args);
  },

  error: (...args) => {
    console.error("[ERROR]", ...args);
  },

  debug: (...args) => {
    if (env.nodeEnv !== "production") {
      console.debug("[DEBUG]", ...args);
    }
  },
};

module.exports = logger;
