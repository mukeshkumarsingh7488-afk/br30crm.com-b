const env = require("./env");

const logger = {
  info: (...args) => {
    if (env.logLevel !== "silent") {
    }
  },

  warn: (...args) => {},

  error: (...args) => {},

  debug: (...args) => {
    if (env.nodeEnv !== "production") {
    }
  },
};

module.exports = logger;
