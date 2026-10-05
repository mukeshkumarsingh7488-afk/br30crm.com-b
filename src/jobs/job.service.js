const BackgroundJob = require("./job.model");
const { processJob } = require("../modules/import-export/import-export.service");
const handlers = {
  IMPORT_PROCESS: async (payload) => processJob(payload.jobId),
  HTTP_WEBHOOK: async (payload) => {
    const r = await fetch(payload.url, { method: payload.method || "POST", headers: { "Content-Type": "application/json", ...(payload.headers || {}) }, body: JSON.stringify(payload.body || {}) });
    if (!r.ok) throw new Error(`Webhook returned ${r.status}`);
    return true;
  },
  WEBHOOK_DELIVERY: async (payload) => {
    const { deliver } = require("../modules/webhooks/webhook-delivery.service");
    return deliver(payload.deliveryId);
  },
  AUTOMATION_CONTINUE: async (payload) => {
    const { continueAutomation } = require("../automation/engine");
    return continueAutomation(payload);
  },
  WORKFLOW_EXECUTE: async (payload) => {
    const { continueWorkflow } = require("../modules/workflows/workflow.engine");
    return continueWorkflow(payload);
  },
};
const enqueue = async (type, payload = {}, options = {}) => BackgroundJob.create({ type, payload, maxAttempts: options.maxAttempts ?? 3, runAt: options.runAt || new Date() });
const runOne = async (job) => {
  try {
    const handler = handlers[job.type];
    if (!handler) throw new Error(`Unknown background job type: ${job.type}`);
    await handler(job.payload);
    job.status = "COMPLETED";
    job.completedAt = new Date();
    job.error = null;
  } catch (error) {
    job.error = error.message;
    job.status = job.attempts >= job.maxAttempts ? "FAILED" : "PENDING";
    job.runAt = new Date(Date.now() + Math.min(60000, 2 ** job.attempts * 1000));
  }
  await job.save();
};
const poll = async (limit = 10) => {
  let processed = 0;
  for (let i = 0; i < limit; i += 1) {
    const job = await BackgroundJob.findOneAndUpdate({ status: "PENDING", runAt: { $lte: new Date() } }, { $set: { status: "PROCESSING", lockedAt: new Date() }, $inc: { attempts: 1 } }, { sort: { runAt: 1 }, returnDocument: "after" });
    if (!job) break;
    await runOne(job);
    processed += 1;
  }
  return processed;
};
const recoverStaleJobs = async (maxAgeMs = 10 * 60 * 1000) => {
  const cutoff = new Date(Date.now() - maxAgeMs);
  return BackgroundJob.updateMany({ status: "PROCESSING", lockedAt: { $lt: cutoff } }, { $set: { status: "PENDING", runAt: new Date(), lockedAt: null } });
};
module.exports = { enqueue, poll, recoverStaleJobs };
