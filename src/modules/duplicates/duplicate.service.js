const Duplicate = require("./duplicate.model");
const Contact = require("../contacts/contact.model");
const Company = require("../companies/company.model");
const Lead = require("../leads/lead.model");
const ApiError = require("../../utils/ApiError");

const CONFIG = {
  CONTACT: { model: Contact, keys: ["email", "phone"] },
  COMPANY: { model: Company, keys: ["email", "phone", "name"] },
  LEAD: { model: Lead, keys: ["email", "phone"] },
};

const normalize = (v) => (v == null ? "" : String(v).trim().toLowerCase());

const detect = async ({ businessId, entityType, createdBy }) => {
  const config = CONFIG[entityType];
  if (!config) throw new ApiError(400, "Unsupported entity type.");

  const docs = await config.model.find({ businessId }).lean();
  const groups = new Map();

  for (const doc of docs) {
    for (const key of config.keys) {
      const value = normalize(doc[key]);
      if (!value) continue;
      const groupKey = `${key}:${value}`;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(doc);
    }
  }

  const created = [];
  for (const [groupKey, items] of groups) {
    if (items.length < 2) continue;
    const reason = groupKey.split(":")[0];
    const primary = items[0];
    for (const duplicate of items.slice(1)) {
      const result = await Duplicate.findOneAndUpdate({ businessId, entityType, primaryId: primary._id, duplicateId: duplicate._id, reason: reason.toUpperCase() }, { $setOnInsert: { createdBy } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
      created.push(result);
    }
  }

  return { detected: created.length };
};

const list = async ({ businessId, status = "OPEN", entityType, page = 1, limit = 25 }) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const filter = { businessId, status };
  if (entityType) filter.entityType = entityType;
  const [items, total] = await Promise.all([
    Duplicate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Duplicate.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const resolve = async ({ businessId, duplicateId, action, userId }) => {
  const item = await Duplicate.findOne({ _id: duplicateId, businessId, status: "OPEN" });
  if (!item) throw new ApiError(404, "Open duplicate record not found.");

  if (action === "ignore") {
    item.status = "IGNORED";
  } else if (action === "merge") {
    const config = CONFIG[item.entityType];
    const primary = await config.model.findOne({ _id: item.primaryId, businessId });
    const duplicate = await config.model.findOne({ _id: item.duplicateId, businessId });
    if (!primary || !duplicate) throw new ApiError(404, "Duplicate source record not found.");

    // Conservative merge: fill only empty fields on the primary record.
    for (const path of config.model.schema.paths ? Object.keys(config.model.schema.paths) : []) {
      if (["_id", "businessId", "createdAt", "updatedAt"].includes(path)) continue;
      const current = primary.get(path);
      const incoming = duplicate.get(path);
      if ((current === null || current === undefined || current === "") && incoming !== null && incoming !== undefined && incoming !== "") {
        primary.set(path, incoming);
      }
    }
    await primary.save();
    item.status = "MERGED";
  } else {
    throw new ApiError(400, "Action must be merge or ignore.");
  }

  item.resolvedBy = userId;
  item.resolvedAt = new Date();
  await item.save();
  return item.toObject();
};

module.exports = { detect, list, resolve };
