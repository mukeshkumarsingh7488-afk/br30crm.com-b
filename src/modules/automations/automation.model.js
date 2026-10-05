const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");

const automationConditionSchema = new mongoose.Schema({
  field: { type: String, required: true, trim: true, maxlength: 150 },
  operator: { type: String, required: true, enum: ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal", "is_empty", "is_not_empty", "in", "not_in"] },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const automationActionSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["update_record", "assign_user", "assign_team", "add_tag", "remove_tag", "create_task", "create_note", "send_notification", "send_email", "send_webhook"] },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  delaySeconds: { type: Number, min: 0, max: 2592000, default: 0 },
}, { _id: false });

const automationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  trigger: {
    mode: { type: String, enum: ["EVENT", "SCHEDULE", "MANUAL"], default: "EVENT" },
    entity: { type: String, required: true, enum: ["lead", "contact", "company", "deal", "task", "activity", "note"] },
    event: { type: String, required: true, enum: ["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"] },
    field: { type: String, trim: true, maxlength: 150, default: null },
    fromValue: { type: mongoose.Schema.Types.Mixed, default: null },
    toValue: { type: mongoose.Schema.Types.Mixed, default: null },
    schedule: {
      enabled: { type: Boolean, default: false },
      runAt: { type: Date, default: null },
      intervalSeconds: { type: Number, min: 60, default: null },
      nextRunAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      timezone: { type: String, trim: true, maxlength: 80, default: "UTC" },
    },
  },
  conditions: { type: [automationConditionSchema], default: [] },
  conditionLogic: { type: String, enum: ["AND", "OR"], default: "AND" },
  actions: { type: [automationActionSchema], default: [] },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE", index: true },
  execution: {
    maxRunsPerRecord: { type: Number, min: 1, default: 1 },
    cooldownSeconds: { type: Number, min: 0, default: 0 },
    stopOnError: { type: Boolean, default: false },
  },
  stats: {
    totalRuns: { type: Number, min: 0, default: 0 },
    successRuns: { type: Number, min: 0, default: 0 },
    failedRuns: { type: Number, min: 0, default: 0 },
    skippedRuns: { type: Number, min: 0, default: 0 },
  },
  lastExecutedAt: { type: Date, default: null },
  lastExecutionStatus: { type: String, enum: ["SUCCESS", "FAILED", "SKIPPED", null], default: null },
  lastExecutionError: { type: String, trim: true, maxlength: 2000, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

automationSchema.index({ businessId: 1, status: 1 });
automationSchema.index({ businessId: 1, "trigger.entity": 1, "trigger.event": 1 });
automationSchema.index({ businessId: 1, "trigger.schedule.nextRunAt": 1, status: 1 });
automationSchema.index({ businessId: 1, createdAt: -1 });

registerModelEvents(automationConditionSchema, "automation");

module.exports = mongoose.model("Automation", automationSchema);
