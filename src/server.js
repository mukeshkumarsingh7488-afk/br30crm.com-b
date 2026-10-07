const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const roleService = require("./modules/roles/role.service");
const { startWorker, stopWorker } = require("./jobs/worker");
const { initAutomationEngine, runAutomationScheduler } = require("./automation");

const startServer = async () => {
  try {
    await connectDB();

    console.log("MongoDB connected successfully.");

    await roleService.repairAccessControl(env.masterAdminUserId);

    initAutomationEngine();
    startWorker();

    const automationTimer = setInterval(() => {
      runAutomationScheduler().catch((error) => {
        console.error("Automation scheduler error:", error);
      });
    }, 60000);

    if (automationTimer.unref) {
      automationTimer.unref();
    }

    const server = app.listen(env.port, () => {
      console.log(`BR30 CRM API running on port ${env.port}.`);
    });

    const shutdown = async () => {
      try {
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
    console.error("BR30 CRM server startup failed:", error);
    process.exit(1);
  }
};

startServer();
