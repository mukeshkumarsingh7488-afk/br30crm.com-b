const Lead = require("../leads/lead.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Deal = require("../deals/deal.model");
const Task = require("../tasks/task.model");
const Activity = require("../activities/activity.model");
const Note = require("../notes/note.model");
const File = require("../files/file.model");
const ApiError = require("../../utils/ApiError");

const MODEL_CONFIG = [
  { key: "leads", model: Lead, fields: ["name", "email", "phone", "companyName", "status"] },
  { key: "contacts", model: Contact, fields: ["firstName", "lastName", "email", "phone", "jobTitle", "status"] },
  { key: "companies", model: Company, fields: ["name", "legalName", "email", "phone", "website", "industry", "status"] },
  { key: "deals", model: Deal, fields: ["title", "name", "description", "status"] },
  { key: "tasks", model: Task, fields: ["title", "description", "status"] },
  { key: "activities", model: Activity, fields: ["title", "description", "type", "status"] },
  { key: "notes", model: Note, fields: ["title", "content"] },
  { key: "files", model: File, fields: ["originalName", "fileName", "description", "mimeType"] },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchBusiness = async ({ businessId, q, type, limit = 10 }) => {
  const query = String(q || "").trim();
  if (query.length < 2) throw new ApiError(400, "Search query must be at least 2 characters.");

  const maxPerType = Math.min(Math.max(Number(limit) || 10, 1), 25);
  const selected = type ? MODEL_CONFIG.filter((item) => item.key === type) : MODEL_CONFIG;

  if (type && !selected.length) throw new ApiError(400, "Unsupported search type.");

  const regex = new RegExp(escapeRegex(query), "i");

  const results = await Promise.all(
    selected.map(async ({ key, model, fields }) => {
      const filter = {
        businessId,
        $or: fields.map((field) => ({ [field]: regex })),
      };

      if (key === "files") filter.status = "ACTIVE";

      const items = await model.find(filter).sort({ updatedAt: -1 }).limit(maxPerType).lean();
      return { type: key, count: items.length, items };
    })
  );

  return {
    query,
    results,
    total: results.reduce((sum, group) => sum + group.count, 0),
  };
};

module.exports = { searchBusiness };
