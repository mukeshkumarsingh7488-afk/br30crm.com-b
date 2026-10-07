const startServer = async () => {
  let env;
  let app;

  try {
    console.log("Starting BR30 CRM server...");

    env = require("./config/env");
    console.log("Environment configuration loaded successfully.");

    app = require("./app");
    console.log("Express application loaded successfully.");

    const { connectDB, disconnectDB } = require("./config/db");
    const roleService = require("./modules/roles/role.service");
    const { startWorker, stopWorker } = require("./jobs/worker");
    const { initAutomationEngine, runAutomationScheduler } = require("./automation");

    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("MongoDB connected successfully.");

    console.log("Repairing access control...");

    await roleService.repairAccessControl(env.masterAdminUserId);

    console.log("Access control ready.");

    initAutomationEngine();
    console.log("Automation engine initialized.");

    startWorker();
    console.log("Background worker started.");

    const automationTimer = setInterval(() => {
      runAutomationScheduler().catch((error) => {
        console.error("Automation scheduler error:", error);
      });
    }, 60000);

    if (automationTimer.unref) {
      automationTimer.unref();
    }

    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`BR30 CRM API running on port ${env.port}.`);
      console.log(`Health check available at /health.`);
    });

    const shutdown = async () => {
      try {
        console.log("Shutting down BR30 CRM server...");

        server.close(async () => {
          stopWorker();
          clearInterval(automationTimer);
          await disconnectDB();

          console.log("BR30 CRM server stopped.");
          process.exit(0);
        });
      } catch (error) {
        console.error("Server shutdown error:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("========================================");
    console.error("BR30 CRM SERVER STARTUP FAILED");
    console.error(error);
    console.error("========================================");
    process.exit(1);
  }
};

startServer();
