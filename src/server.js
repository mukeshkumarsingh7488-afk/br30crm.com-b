const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");
const roleService = require("./modules/roles/role.service");
const { startWorker, stopWorker } = require("./jobs/worker");
const { initAutomationEngine, runAutomationScheduler } = require("./automation");

const startServer = async () => {
  try {
    await connectDB();
    await roleService.repairAccessControl(env.masterAdminUserId);
    initAutomationEngine();
    startWorker();
    const automationTimer = setInterval(() => {
      runAutomationScheduler().catch(() => {});
    }, 60000);
    if (automationTimer.unref) automationTimer.unref();
    const server = app.listen(env.port);
    const shutdown = async () => {
      server.close(async () => {
        stopWorker();
        clearInterval(automationTimer);
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch {
    process.exit(1);
  }
};

startServer();
