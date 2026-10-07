const { poll, recoverStaleJobs } = require("./job.service");

let timer = null;

const startWorker = () => {
  if (timer) return;
  timer = setInterval(() => {
    poll(10).catch(() => {});
  }, 5000);
  recoverStaleJobs().catch(() => {});
  if (timer.unref) timer.unref();
};

const stopWorker = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = { startWorker, stopWorker };
