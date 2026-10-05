const ImportJob = require("./import-job.model");
const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const ApiError = require("../../utils/ApiError");
const MODELS = { LEAD: Lead, CONTACT: Contact, COMPANY: Company, DEAL: Deal };

const parseCsv = (csv) => {
  const lines = String(csv || "")
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = "",
      quote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quote = !quote;
      } else if (c === "," && !quote) {
        out.push(cur.trim());
        cur = "";
      } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    return headers.reduce((o, h, i) => {
      o[h] = vals[i] ?? "";
      return o;
    }, {});
  });
};

const createImport = async ({ businessId, userId, entityType, csv, rows, fileName }) => {
  if (!MODELS[entityType]) throw new ApiError(400, "Unsupported import entity.");
  const parsed = Array.isArray(rows) ? rows : parseCsv(csv);
  if (!parsed.length) throw new ApiError(400, "No import rows supplied.");
  const job = await ImportJob.create({ businessId, userId, direction: "IMPORT", entityType, status: "PENDING", totalRows: parsed.length, fileName });
  // Keep payload in job result so the worker can process it without another storage dependency.
  job.result = { rows: parsed.slice(0, 10000) };
  await job.save();
  return job;
};

const list = async ({ businessId, page = 1, limit = 25 }) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const filter = { businessId };
  const [items, total] = await Promise.all([
    ImportJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ImportJob.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const get = async ({ businessId, jobId }) => {
  const job = await ImportJob.findOne({ _id: jobId, businessId }).lean();
  if (!job) throw new ApiError(404, "Import/export job not found.");
  return job;
};

const exportData = async ({ businessId, userId, entityType, filter = {} }) => {
  const model = MODELS[entityType];
  if (!model) throw new ApiError(400, "Unsupported export entity.");
  const safeFilter = { businessId };
  for (const key of ["status", "source", "assignedTo", "assignedTeamId", "companyId", "pipelineId", "stageId", "lifecycleStage"]) {
    if (filter[key] !== undefined && filter[key] !== null && filter[key] !== "") safeFilter[key] = filter[key];
  }
  const rows = await model.find(safeFilter).limit(10000).lean();
  const job = await ImportJob.create({ businessId, userId, direction: "EXPORT", entityType, status: "COMPLETED", totalRows: rows.length, processedRows: rows.length, successRows: rows.length, completedAt: new Date(), result: { rows } });
  return job;
};

const processJob = async (jobId) => {
  const job = await ImportJob.findById(jobId);
  if (!job || job.direction !== "IMPORT" || job.status !== "PENDING") return;
  const model = MODELS[job.entityType];
  job.status = "PROCESSING";
  job.startedAt = new Date();
  await job.save();
  const rows = job.result?.rows || [];
  const errors = [];
  let success = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = { ...rows[i], businessId: job.businessId, createdBy: job.userId };
      await model.create(row);
      success++;
    } catch (error) {
      errors.push({ row: i + 1, message: error.message });
    }
  }
  job.processedRows = rows.length;
  job.successRows = success;
  job.failedRows = rows.length - success;
  job.rowErrors = errors.slice(0, 500);
  job.status = errors.length && success === 0 ? "FAILED" : "COMPLETED";
  job.completedAt = new Date();
  job.result = null;
  await job.save();
};

module.exports = { createImport, list, get, exportData, processJob, parseCsv };
