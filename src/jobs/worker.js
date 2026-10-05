const { poll, recoverStaleJobs } = require("./job.service");

let timer = null;

const startWorker = () => {
  if (timer) return;

  timer = setInterval(() => {
    poll(10).catch((error) => console.error("Background worker error:", error));
  }, 5000);

  recoverStaleJobs().catch((error) => console.error("Background job recovery error:", error));

  if (timer.unref) timer.unref();

  console.log("Background worker started.");
};

const stopWorker = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = { startWorker, stopWorker };
