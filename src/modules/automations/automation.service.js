const mongoose = require("mongoose");
const Automation = require("./automation.model");
const AutomationExecution = require("./automation-execution.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");

const ENTITY_VALUES = ["lead", "contact", "company", "deal", "task", "activity", "note"];
const EVENT_VALUES = ["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"];
const ACTION_VALUES = ["update_record", "assign_user", "assign_team", "add_tag", "remove_tag", "create_task", "create_note", "send_notification", "send_email", "send_webhook"];
const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const validateBusiness = async (businessId) => {
  if (!isValidObjectId(businessId)) throw new ApiError(400, "Invalid business ID");
  const business = await Business.findById(businessId).select("_id status");
  if (!business) throw new ApiError(404, "Business not found");
  if (business.status && business.status !== "ACTIVE") throw new ApiError(400, "Business is not active");
  return business;
};
const validateMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({ businessId, userId, status: "ACTIVE" }).select("_id");
  if (!member) throw new ApiError(403, "You are not an active member of this business");
};
const normalizeConditions = (conditions = []) => {
  if (!Array.isArray(conditions)) throw new ApiError(400, "Conditions must be an array");
  return conditions.map((c) => ({ field: String(c.field || "").trim(), operator: c.operator, value: Object.prototype.hasOwnProperty.call(c, "value") ? c.value : null }));
};
const validateActions = (actions = []) => {
  if (!Array.isArray(actions) || actions.length === 0) throw new ApiError(400, "At least one automation action is required");
  return actions.map((a) => {
    if (!ACTION_VALUES.includes(a.type)) throw new ApiError(400, `Invalid automation action type: ${a.type}`);
    const config = a.config && typeof a.config === "object" && !Array.isArray(a.config) ? a.config : {};
    const required = { assign_user: ["userId"], assign_team: ["teamId"], send_notification: ["recipientId"], send_email: ["to"], send_webhook: ["url"] }[a.type] || [];
    for (const key of required) if (!config[key]) throw new ApiError(400, `${a.type} requires config.${key}`);
    if (a.type === "add_tag" || a.type === "remove_tag") if (!config.tagId && !Array.isArray(config.tagIds)) throw new ApiError(400, `${a.type} requires tagId or tagIds`);
    if (a.type === "update_record" && !(config.fields || config.update)) throw new ApiError(400, "update_record requires config.fields or config.update");
    if (a.type === "create_note" && !config.content && !config.message) throw new ApiError(400, "create_note requires config.content or config.message");
    return { type: a.type, config, delaySeconds: Math.max(0, Number(a.delaySeconds) || 0) };
  });
};
const normalizeTrigger = (trigger = {}) => {
  if (!ENTITY_VALUES.includes(trigger.entity)) throw new ApiError(400, "Invalid trigger entity");
  if (!EVENT_VALUES.includes(trigger.event)) throw new ApiError(400, "Invalid trigger event");
  const mode = trigger.mode || "EVENT";
  if (!["EVENT", "SCHEDULE", "MANUAL"].includes(mode)) throw new ApiError(400, "Invalid trigger mode");
  const schedule = trigger.schedule || {};
  if (mode === "SCHEDULE") {
    if (!schedule.runAt && !schedule.intervalSeconds) throw new ApiError(400, "Scheduled automation requires runAt or intervalSeconds");
    if (schedule.intervalSeconds != null && Number(schedule.intervalSeconds) < 60) throw new ApiError(400, "intervalSeconds must be at least 60");
  }
  return {
    mode,
    entity: trigger.entity,
    event: trigger.event,
    field: trigger.field ? String(trigger.field).trim() : null,
    fromValue: Object.prototype.hasOwnProperty.call(trigger, "fromValue") ? trigger.fromValue : null,
    toValue: Object.prototype.hasOwnProperty.call(trigger, "toValue") ? trigger.toValue : null,
    schedule: {
      enabled: mode === "SCHEDULE",
      runAt: schedule.runAt ? new Date(schedule.runAt) : null,
      intervalSeconds: schedule.intervalSeconds ? Number(schedule.intervalSeconds) : null,
      nextRunAt: schedule.nextRunAt ? new Date(schedule.nextRunAt) : schedule.runAt ? new Date(schedule.runAt) : schedule.intervalSeconds ? new Date(Date.now() + Number(schedule.intervalSeconds) * 1000) : null,
      endAt: schedule.endAt ? new Date(schedule.endAt) : null,
      timezone: schedule.timezone || "UTC",
    },
  };
};
const buildData = (data, userId, existing = null) => {
  const trigger = data.trigger
    ? normalizeTrigger({ ...(existing?.trigger?.toObject ? existing.trigger.toObject() : existing?.trigger || {}), ...data.trigger, schedule: { ...(existing?.trigger?.schedule?.toObject ? existing.trigger.schedule.toObject() : existing?.trigger?.schedule || {}), ...(data.trigger.schedule || {}) } })
    : existing.trigger;
  const actions = data.actions !== undefined ? validateActions(data.actions) : existing.actions;
  return {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description || "" : existing.description,
    trigger,
    conditions: data.conditions !== undefined ? normalizeConditions(data.conditions) : existing.conditions,
    conditionLogic: data.conditionLogic || existing.conditionLogic || "AND",
    actions,
    status: data.status || existing.status || "INACTIVE",
    execution: data.execution
      ? {
          maxRunsPerRecord: Number(data.execution.maxRunsPerRecord ?? existing?.execution?.maxRunsPerRecord ?? 1),
          cooldownSeconds: Number(data.execution.cooldownSeconds ?? existing?.execution?.cooldownSeconds ?? 0),
          stopOnError: Boolean(data.execution.stopOnError ?? existing?.execution?.stopOnError ?? false),
        }
      : existing?.execution || { maxRunsPerRecord: 1, cooldownSeconds: 0, stopOnError: false },
    updatedBy: userId,
  };
};

const createAutomation = async ({ businessId, userId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  const normalized = buildData(data, userId, { trigger: {}, status: "INACTIVE", execution: { maxRunsPerRecord: 1, cooldownSeconds: 0, stopOnError: false }, conditionLogic: "AND", conditions: [] });
  return Automation.create({ businessId, ...normalized, createdBy: userId });
};
const getAutomations = async ({ businessId, userId, status, entity, search, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const filter = { businessId };
  if (status) filter.status = status;
  if (entity) filter["trigger.entity"] = entity;
  if (search) filter.$or = [{ name: { $regex: search.trim(), $options: "i" } }, { description: { $regex: search.trim(), $options: "i" } }];
  const sort = { [sortBy === "name" ? "name" : "createdAt"]: sortOrder === "asc" ? 1 : -1 };
  const [automations, total] = await Promise.all([
    Automation.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Automation.countDocuments(filter),
  ]);
  return { automations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
const getAutomationById = async ({ businessId, userId, automationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  const automation = await Automation.findOne({ _id: automationId, businessId }).populate("createdBy", "name email").populate("updatedBy", "name email").lean();
  if (!automation) throw new ApiError(404, "Automation not found");
  return automation;
};
const updateAutomation = async ({ businessId, userId, automationId, data }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  const automation = await Automation.findOne({ _id: automationId, businessId });
  if (!automation) throw new ApiError(404, "Automation not found");
  Object.assign(automation, buildData(data, userId, automation));
  await automation.save();
  return automation;
};
const updateAutomationStatus = async ({ businessId, userId, automationId, status }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  if (!["ACTIVE", "INACTIVE"].includes(status)) throw new ApiError(400, "Status must be ACTIVE or INACTIVE");
  const automation = await Automation.findOne({ _id: automationId, businessId });
  if (!automation) throw new ApiError(404, "Automation not found");
  automation.status = status;
  automation.updatedBy = userId;
  if (status === "ACTIVE" && automation.trigger.mode === "SCHEDULE" && !automation.trigger.schedule.nextRunAt) automation.trigger.schedule.nextRunAt = automation.trigger.schedule.runAt || new Date();
  await automation.save();
  return automation;
};
const deleteAutomation = async ({ businessId, userId, automationId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  const automation = await Automation.findOneAndDelete({ _id: automationId, businessId });
  if (!automation) throw new ApiError(404, "Automation not found");
  await AutomationExecution.deleteMany({ automationId });
  return automation;
};
const executeAutomationManually = async ({ businessId, userId, automationId, entityId, record }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  const automation = await Automation.findOne({ _id: automationId, businessId });
  if (!automation) throw new ApiError(404, "Automation not found");
  const { processAutomation } = require("../../automation/engine");
  return processAutomation(automation, { businessId, entity: automation.trigger.entity, entityId: entityId || null, record: record || {}, actorId: userId, manual: true }, "manual.execute");
};
const getExecutions = async ({ businessId, userId, automationId, status, page = 1, limit = 20 }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(automationId)) throw new ApiError(400, "Invalid automation ID");
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const filter = { businessId, automationId };
  if (status) filter.status = status;
  const [executions, total] = await Promise.all([
    AutomationExecution.find(filter)
      .populate("actorId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AutomationExecution.countDocuments(filter),
  ]);
  return { executions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
const getAutomationMetadata = async ({ businessId, userId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  const entities = {
    lead: require("../leads/lead.model"),
    contact: require("../contacts/contact.model"),
    company: require("../companies/company.model"),
    deal: require("../deals/deal.model"),
    task: require("../tasks/task.model"),
    activity: require("../activities/activity.model"),
    note: require("../notes/note.model"),
  };
  const fields = {};
  for (const [entity, Model] of Object.entries(entities))
    fields[entity] = Object.keys(Model.schema.paths)
      .filter((key) => !["_id", "__v", "businessId"].includes(key))
      .slice(0, 200);
  fields.lead = Array.from(new Set([
    ...(fields.lead || []),
    "customFields._leadGeneration.formPurpose",
    "customFields._leadGeneration.isSupportTicket",
    "customFields._leadGeneration.formName",
    "customFields._leadGeneration.formSlug",
    "customFields._leadGeneration.source",
    "customFields._leadGeneration.campaign",
  ]));
  return {
    entities: ENTITY_VALUES,
    events: EVENT_VALUES,
    conditionOperators: ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal", "is_empty", "is_not_empty", "in", "not_in"],
    actionTypes: ACTION_VALUES,
    fields,
    triggerModes: ["EVENT", "SCHEDULE", "MANUAL"],
    statuses: ["ACTIVE", "INACTIVE"],
    actionConfig: {
      update_record: ["fields"],
      assign_user: ["userId"],
      assign_team: ["teamId"],
      add_tag: ["tagId", "tagIds"],
      remove_tag: ["tagId", "tagIds"],
      create_task: ["title", "description", "priority", "dueDate", "assignedTo"],
      create_note: ["title", "content"],
      send_notification: ["recipientId", "title", "message"],
      send_email: ["to", "subject", "html"],
      send_webhook: ["url", "method", "headers"],
    },
  };
};
const cloneAutomation = async ({ businessId, userId, automationId, name }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  const source = await Automation.findOne({ _id: automationId, businessId }).lean();
  if (!source) throw new ApiError(404, "Automation not found");
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  delete source.lastExecutedAt;
  delete source.lastExecutionStatus;
  delete source.lastExecutionError;
  delete source.stats;
  return Automation.create({ ...source, name: name?.trim() || `${source.name} (Copy)`, status: "INACTIVE", createdBy: userId, updatedBy: userId });
};
const getExecutionById = async ({ businessId, userId, executionId }) => {
  await validateBusiness(businessId);
  await validateMember(businessId, userId);
  if (!isValidObjectId(executionId)) throw new ApiError(400, "Invalid execution ID");
  const execution = await AutomationExecution.findOne({ _id: executionId, businessId }).populate("actorId", "name email").lean();
  if (!execution) throw new ApiError(404, "Automation execution not found");
  return execution;
};

module.exports = { createAutomation, getAutomations, getAutomationById, updateAutomation, updateAutomationStatus, deleteAutomation, executeAutomationManually, getExecutions, getExecutionById, cloneAutomation, getAutomationMetadata };
