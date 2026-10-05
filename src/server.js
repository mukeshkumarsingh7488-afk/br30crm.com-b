const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const roleService = require("./modules/roles/role.service");
const { startWorker, stopWorker } = require("./jobs/worker");
const { initAutomationEngine, runAutomationScheduler } = require("./automation");

const startServer = async () => {
  try {
    await connectDB();

    /*
     * ============================================================
     * ACCESS CONTROL BOOTSTRAP / REPAIR
     * ============================================================
     *
     * Ensures:
     * - System permissions exist
     * - System roles exist
     * - Business Owner has all permissions
     * - Existing owner memberships have correct role
     *
     * Safe to run on every startup because the service
     * only creates/repairs missing data.
     * ============================================================
     */

    await roleService.repairAccessControl(env.masterAdminUserId);

    initAutomationEngine();
    startWorker();
    const automationTimer = setInterval(() => { runAutomationScheduler().catch((error) => console.error("Automation scheduler error:", error)); }, 60000);
    if (automationTimer.unref) automationTimer.unref();

    const server = app.listen(env.port, () => {
      console.log("");
      console.log("========================================");
      console.log("        BR30 CRM API");
      console.log("========================================");
      console.log(`Environment : ${env.nodeEnv}`);
      console.log(`Port        : ${env.port}`);
      console.log(`URL         : ${env.appUrl}`);
      console.log("========================================");
      console.log("");
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async () => {
        stopWorker();
        clearInterval(automationTimer);
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
