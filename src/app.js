const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const env = require("./config/env");
const requestId = require("./middleware/requestId");
const routes = require("./routes/index");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendUrls.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  })
);

app.use(requestId);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

app.use(cookieParser());

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 2000,
    standardHeaders: true,
    legacyHeaders: true,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "BR30 CRM API is running",
    version: "v1",
  });
});

app.get("/health", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        status: "unhealthy",
        message: "Database connection is not ready.",
        database: "disconnected",
      });
    }

    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      success: true,
      status: "healthy",
      message: "BR30 CRM API is healthy.",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      success: false,
      status: "unhealthy",
      message: "Service is not healthy.",
      database: "error",
    });
  }
});

app.use("/api/v1", routes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
