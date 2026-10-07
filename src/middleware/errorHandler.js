const env = require("../config/env");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: statusCode === 500 && env.nodeEnv === "production" ? "Internal server error" : err.message || "Internal server error",
    requestId: req.requestId || null,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (env.nodeEnv !== "production") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
