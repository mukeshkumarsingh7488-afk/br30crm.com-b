const mongoose = require("mongoose");
const Automation = require("../modules/automations/automation.model");
const AutomationExecution = require("../modules/automations/automation-execution.model");
const Lead = require("../modules/leads/lead.model");
const Contact = require("../modules/contacts/contact.model");
const Company = require("../modules/companies/company.model");
const Deal = require("../modules/deals/deal.model");
const Task = require("../modules/tasks/task.model");
const Note = require("../modules/notes/note.model");
const Activity = require("../modules/activities/activity.model");
const Notification = require("../modules/notifications/notification.model");
const BusinessMember = require("../modules/business-members/business-member.model");
const Team = require("../modules/teams/team.model");
const Tag = require("../modules/tags/tag.model");
const { sendEmail } = require("../services/email.service");
const { publish } = require("../events/eventBus");
const { runWithAutomationContext } = require("../events/automationContext");
const { enqueue } = require("../jobs/job.service");

const MODELS = { lead: Lead, contact: Contact, company: Company, deal: Deal, task: Task, activity: Activity, note: Note };
const valueAt = (obj, path) =>
  String(path || "")
    .split(".")
    .reduce((v, k) => (v == null ? undefined : v[k]), obj);
const match = (actual, operator, expected) => {
  if (operator === "is_empty") return actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
  if (operator === "is_not_empty") return !(actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0));
  const a = actual,
    b = expected;
  switch (operator) {
    case "equals":
      return String(a) === String(b);
    case "not_equals":
      return String(a) !== String(b);
    case "contains":
      return Array.isArray(a)
        ? a.map(String).includes(String(b))
        : String(a ?? "")
            .toLowerCase()
            .includes(String(b ?? "").toLowerCase());
    case "not_contains":
      return !String(a ?? "")
        .toLowerCase()
        .includes(String(b ?? "").toLowerCase());
    case "starts_with":
      return String(a ?? "")
        .toLowerCase()
        .startsWith(String(b ?? "").toLowerCase());
    case "ends_with":
      return String(a ?? "")
        .toLowerCase()
        .endsWith(String(b ?? "").toLowerCase());
    case "greater_than":
      return Number(a) > Number(b);
    case "less_than":
      return Number(a) < Number(b);
    case "greater_than_or_equal":
      return Number(a) >= Number(b);
    case "less_than_or_equal":
      return Number(a) <= Number(b);
    case "in":
      return Array.isArray(b) && b.map(String).includes(String(a));
    case "not_in":
      return Array.isArray(b) && !b.map(String).includes(String(a));
    default:
      return false;
  }
};
const conditionsPass = (conditions, logic, record) => {
  if (!conditions?.length) return true;
  const results = conditions.map((c) => match(valueAt(record, c.field), c.operator, c.value));
  return logic === "OR" ? results.some(Boolean) : results.every(Boolean);
};
const transitionPass = (trigger, payload) => {
  if (!trigger.field || (trigger.fromValue == null && trigger.toValue == null)) return true;
  const current = valueAt(payload.record || {}, trigger.field);
  const previous = valueAt(payload.previousRecord || {}, trigger.field);
  if (trigger.fromValue != null && String(previous) !== String(trigger.fromValue)) return false;
  if (trigger.toValue != null && String(current) !== String(trigger.toValue)) return false;
  return true;
};
const validateRef = async (businessId, type, id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new Error(`${type} reference is required and must be valid`);
  if (type === "user") {
    const ok = await BusinessMember.exists({ businessId, userId: id, status: "ACTIVE" });
    if (!ok) throw new Error("Assigned user is not an active business member");
  }
  if (type === "team") {
    const ok = await Team.exists({ _id: id, businessId, status: "ACTIVE" });
    if (!ok) throw new Error("Assigned team is not active");
  }
  if (type === "tag") {
    const ok = await Tag.exists({ _id: id, businessId, isActive: true });
    if (!ok) throw new Error("Tag is not active");
  }
};
const executeAction = async ({ automation, payload, action }) => {
  const cfg = action.config || {};
  const entity = String(payload.entity || "").toLowerCase();
  const Model = MODELS[entity];
  const idValid = mongoose.Types.ObjectId.isValid(payload.entityId);
  if (["update_record", "assign_user", "assign_team", "add_tag", "remove_tag"].includes(action.type) && (!Model || !idValid)) throw new Error(`Action ${action.type} requires a supported entity record`);
  if (action.type === "update_record") {
    const update = cfg.fields || cfg.update || {};
    if (!Object.keys(update).length) throw new Error("update_record has no fields");
    await Model.updateOne({ _id: payload.entityId, businessId: payload.businessId }, { $set: update });
    return { type: action.type, status: "SUCCESS" };
  }
  if (action.type === "assign_user") {
    await validateRef(payload.businessId, "user", cfg.userId);
    await Model.updateOne({ _id: payload.entityId, businessId: payload.businessId }, { $set: { assignedTo: cfg.userId } });
    return { type: action.type, status: "SUCCESS" };
  }
  if (action.type === "assign_team") {
    await validateRef(payload.businessId, "team", cfg.teamId);
    await Model.updateOne({ _id: payload.entityId, businessId: payload.businessId }, { $set: { assignedTeamId: cfg.teamId } });
    return { type: action.type, status: "SUCCESS" };
  }
  if (action.type === "add_tag" || action.type === "remove_tag") {
    const ids = Array.isArray(cfg.tagIds) ? cfg.tagIds : cfg.tagId ? [cfg.tagId] : [];
    for (const id of ids) await validateRef(payload.businessId, "tag", id);
    const op = action.type === "add_tag" ? { $addToSet: { tags: { $each: ids } } } : { $pull: { tags: { $in: ids } } };
    await Model.updateOne({ _id: payload.entityId, businessId: payload.businessId }, op);
    return { type: action.type, status: "SUCCESS", count: ids.length };
  }
  if (action.type === "create_task") {
    const relatedType = entity.toUpperCase();
    const relatedAllowed = ["LEAD", "CONTACT", "COMPANY", "DEAL"];

    const assignedTo = cfg.assignedTo || payload.record?.assignedTo || null;

    if (assignedTo) {
      await validateRef(payload.businessId, "user", assignedTo);
    }

    const task = await Task.create({
      businessId: payload.businessId,
      title: cfg.title || `Follow up: ${payload.record?.name || payload.record?.email || payload.entityId || "record"}`,
      description: cfg.description || "Created by BR30 CRM automation",
      status: "TODO",
      priority: cfg.priority || "MEDIUM",
      dueDate: cfg.dueDate ? new Date(cfg.dueDate) : new Date(Date.now() + 86400000),
      assignedTo,
      createdBy: payload.actorId,
      relatedTo: relatedAllowed.includes(relatedType) && payload.entityId ? { type: relatedType, id: payload.entityId } : undefined,
    });

    return {
      type: action.type,
      status: "SUCCESS",
      id: task._id,
    };
  }
  if (action.type === "create_note") {
    const map = { LEAD: "leadId", CONTACT: "contactId", COMPANY: "companyId", DEAL: "dealId" };
    const ref = { createdBy: payload.actorId, businessId: payload.businessId, title: cfg.title || automation.name, content: cfg.content || cfg.message || "Created by BR30 CRM automation" };
    if (map[entity.toUpperCase()] && payload.entityId) ref[map[entity.toUpperCase()]] = payload.entityId;
    const note = await Note.create(ref);
    return { type: action.type, status: "SUCCESS", id: note._id };
  }
  if (action.type === "send_notification") {
    await validateRef(payload.businessId, "user", cfg.recipientId);
    const notification = await Notification.create({
      businessId: payload.businessId,
      recipientId: cfg.recipientId,
      type: "SYSTEM",
      title: cfg.title || automation.name,
      message: cfg.message || `Automation executed for ${payload.entity}.`,
      status: "UNREAD",
      entityType: payload.entity,
      entityId: payload.entityId,
      metadata: { automationId: automation._id },
      createdBy: payload.actorId,
    });
    return { type: action.type, status: "SUCCESS", id: notification._id };
  }
  if (action.type === "send_email") {
    await sendEmail({ to: cfg.to, subject: cfg.subject || automation.name, html: cfg.html || cfg.message || "BR30 CRM automation executed." });
    return { type: action.type, status: "SUCCESS" };
  }
  if (action.type === "send_webhook") {
    const response = await fetch(cfg.url, { method: cfg.method || "POST", headers: { "Content-Type": "application/json", ...(cfg.headers || {}) }, body: JSON.stringify({ event: `automation.${automation._id}`, payload }) });
    if (!response.ok) throw new Error(`Automation webhook returned ${response.status}`);
    return { type: action.type, status: "SUCCESS", httpStatus: response.status };
  }
  throw new Error(`Unsupported automation action: ${action.type}`);
};

const processAutomation = async (automation, payload, event, options = {}) => {
  if (!automation || (automation.status !== "ACTIVE" && !options.manual)) return { status: "SKIPPED", reason: "inactive" };
  if (!options.manual && automation.trigger.mode !== "EVENT") return { status: "SKIPPED", reason: "not_event_trigger" };
  if (!options.manual && automation.trigger.mode === "EVENT" && `${automation.trigger.entity}.${automation.trigger.event}` !== String(event).toLowerCase()) return { status: "SKIPPED", reason: "event_mismatch" };

  // A support-form lead is a special lead subtype. Do not let an
  // unconditional generic lead.created automation also process it.
  // Support automations must explicitly target isSupportTicket=true.
  const isSupportTicketLead = String(payload.entity || "").toLowerCase() === "lead" &&
    String(event || "").toLowerCase() === "lead.created" &&
    (payload.record?.customFields?._leadGeneration?.isSupportTicket === true ||
      String(payload.record?.customFields?._leadGeneration?.isSupportTicket).toLowerCase() === "true");
  if (isSupportTicketLead) {
    const explicitSupportCondition = (automation.conditions || []).some((condition) => {
      const field = String(condition?.field || "").toLowerCase();
      return field === "customfields._leadgeneration.issupportticket" || field === "customfields._leadgeneration.formpurpose";
    });
    if (!explicitSupportCondition) {
      return { status: "SKIPPED", reason: "support_ticket_requires_explicit_condition" };
    }
  }

  if (!conditionsPass(automation.conditions, automation.conditionLogic, payload.record || {})) return { status: "SKIPPED", reason: "conditions" };
  if (!transitionPass(automation.trigger, payload)) return { status: "SKIPPED", reason: "transition" };
  if (automation.execution?.cooldownSeconds && automation.lastExecutedAt && Date.now() - new Date(automation.lastExecutedAt).getTime() < automation.execution.cooldownSeconds * 1000) return { status: "SKIPPED", reason: "cooldown" };
  if (payload.entityId && automation.execution?.maxRunsPerRecord) {
    const count = await AutomationExecution.countDocuments({ automationId: automation._id, entityId: payload.entityId, status: "SUCCESS" });
    if (count >= automation.execution.maxRunsPerRecord) return { status: "SKIPPED", reason: "max_runs_per_record" };
  }
  const startedAt = new Date();
  const execution = await AutomationExecution.create({
    businessId: payload.businessId,
    automationId: automation._id,
    entity: payload.entity || automation.trigger.entity,
    entityId: payload.entityId || null,
    event,
    actorId: payload.actorId || null,
    status: "RUNNING",
    startedAt,
    metadata: { manual: Boolean(options.manual) },
  });
  const results = [];
  try {
    for (const action of automation.actions || []) {
      if (action.delaySeconds > 0) {
        await enqueue("AUTOMATION_CONTINUE", { automationId: automation._id.toString(), executionId: execution._id.toString(), payload, event, actionIndex: results.length }, { runAt: new Date(Date.now() + action.delaySeconds * 1000), maxAttempts: 1 });
        execution.status = "SUCCESS";
        execution.completedAt = new Date();
        execution.durationMs = Date.now() - startedAt.getTime();
        execution.actionResults = results.concat([{ type: action.type, status: "SCHEDULED", delaySeconds: action.delaySeconds }]);
        await execution.save();
        await Automation.updateOne({ _id: automation._id }, { $inc: { "stats.totalRuns": 1, "stats.successRuns": 1 }, $set: { lastExecutedAt: new Date(), lastExecutionStatus: "SUCCESS", lastExecutionError: null } });
        return { status: "SUCCESS", executionId: execution._id, scheduled: true };
      }
      try {
        results.push(await executeAction({ automation, payload, action }));
      } catch (error) {
        results.push({ type: action.type, status: "FAILED", error: error.message });
        if (automation.execution?.stopOnError) throw error;
      }
    }
    const failed = results.some((r) => r.status === "FAILED");
    execution.status = failed ? "FAILED" : "SUCCESS";
    execution.error = failed
      ? results
          .filter((r) => r.error)
          .map((r) => r.error)
          .join("; ")
      : null;
    execution.actionResults = results;
    execution.completedAt = new Date();
    execution.durationMs = Date.now() - startedAt.getTime();
    await execution.save();
    await Automation.updateOne({ _id: automation._id }, { $inc: { "stats.totalRuns": 1, ...(failed ? { "stats.failedRuns": 1 } : { "stats.successRuns": 1 }) }, $set: { lastExecutedAt: new Date(), lastExecutionStatus: failed ? "FAILED" : "SUCCESS", lastExecutionError: execution.error } });
    await publish(`automation.${payload.entity || automation.trigger.entity}.${automation.trigger.event}`, {
      businessId: payload.businessId,
      entity: payload.entity,
      entityId: payload.entityId,
      automationId: automation._id.toString(),
      executionId: execution._id.toString(),
      actorId: payload.actorId,
    });
    return { status: execution.status, executionId: execution._id };
  } catch (error) {
    execution.status = "FAILED";
    execution.error = error.message;
    execution.actionResults = results;
    execution.completedAt = new Date();
    execution.durationMs = Date.now() - startedAt.getTime();
    await execution.save();
    await Automation.updateOne({ _id: automation._id }, { $inc: { "stats.totalRuns": 1, "stats.failedRuns": 1 }, $set: { lastExecutedAt: new Date(), lastExecutionStatus: "FAILED", lastExecutionError: error.message } });
    return { status: "FAILED", executionId: execution._id, error: error.message };
  }
};

const processEvent = async (payload, event) => {
  const [entity, eventName] = String(event).toLowerCase().split(".");
  if (!payload?.businessId || !entity || !eventName || entity === "automation") return;
  const automations = await Automation.find({ businessId: payload.businessId, status: "ACTIVE", "trigger.mode": "EVENT", "trigger.entity": entity, "trigger.event": eventName }).limit(100);
  for (const automation of automations) {
    if (payload.automationId && String(payload.automationId) === String(automation._id)) continue;
    if (Number(payload.automationDepth || 0) >= 5) continue;
    try {
      await runWithAutomationContext({ automationId: automation._id.toString(), depth: Number(payload.automationDepth || 0) + 1 }, () => processAutomation(automation, payload, event));
    } catch (error) {
      console.error(`Automation ${automation._id} failed:`, error.message);
    }
  }
};
const runScheduledAutomations = async (limit = 25) => {
  const now = new Date();
  const automations = await Automation.find({ status: "ACTIVE", "trigger.mode": "SCHEDULE", "trigger.schedule.enabled": true, "trigger.schedule.nextRunAt": { $lte: now }, $or: [{ "trigger.schedule.endAt": null }, { "trigger.schedule.endAt": { $gt: now } }] }).limit(limit);
  for (const automation of automations) {
    const payload = { businessId: automation.businessId, entity: automation.trigger.entity, entityId: null, record: {}, actorId: automation.updatedBy || automation.createdBy };
    await processAutomation(automation, payload, "schedule.execute", { manual: true });
    const interval = Number(automation.trigger.schedule.intervalSeconds || 0);
    const next = interval ? new Date(Date.now() + interval * 1000) : null;
    await Automation.updateOne({ _id: automation._id }, { $set: { "trigger.schedule.nextRunAt": next, ...(next ? {} : { status: "INACTIVE" }) } });
  }
  return automations.length;
};
const continueAutomation = async ({ automationId, executionId, payload, event, actionIndex = 0 }) => {
  const automation = await Automation.findById(automationId);
  const execution = await AutomationExecution.findById(executionId);
  if (!automation || !execution) throw new Error("Automation execution context not found");
  for (let i = actionIndex; i < automation.actions.length; i += 1) {
    const action = automation.actions[i];
    if (action.delaySeconds > 0) {
      await enqueue("AUTOMATION_CONTINUE", { automationId, executionId, payload, event, actionIndex: i + 1 }, { runAt: new Date(Date.now() + action.delaySeconds * 1000), maxAttempts: 1 });
      execution.actionResults.push({ type: action.type, status: "SCHEDULED", delaySeconds: action.delaySeconds });
      execution.currentAction = i + 1;
      await execution.save();
      return;
    }
    const result = await executeAction({ automation, payload, action });
    execution.actionResults.push(result);
  }
  execution.completedAt = new Date();
  execution.durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();
  execution.status = "SUCCESS";
  await execution.save();
  await Automation.updateOne({ _id: automation._id }, { $inc: { "stats.successRuns": 1 }, $set: { lastExecutedAt: new Date(), lastExecutionStatus: "SUCCESS", lastExecutionError: null } });
};
module.exports = { processEvent, processAutomation, runScheduledAutomations, continueAutomation, executeAction };
