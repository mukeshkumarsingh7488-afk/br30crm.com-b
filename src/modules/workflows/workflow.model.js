const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");
const condition = new mongoose.Schema({ field: { type: String, required: true, trim: true, maxlength: 150 }, operator: { type: String, required: true }, value: { type: mongoose.Schema.Types.Mixed, default: null } }, { _id: false });
const step = new mongoose.Schema({ id: { type: String, required: true, trim: true, maxlength: 80 }, name: { type: String, trim: true, maxlength: 150, default: "" }, type: { type: String, required: true }, config: { type: mongoose.Schema.Types.Mixed, default: {} }, delaySeconds: { type: Number, min: 0, max: 2592000, default: 0 }, continueOnError: { type: Boolean, default: false } }, { _id: false });
const workflowSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  trigger: {
    mode: { type: String, enum: ["EVENT", "SCHEDULE", "MANUAL"], default: "EVENT" },
    entity: { type: String, required: true, enum: ["lead", "contact", "company", "deal", "task", "activity", "note"] },
    event: { type: String, required: true, enum: ["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"] },
    field: { type: String, default: null }, fromValue: { type: mongoose.Schema.Types.Mixed, default: null }, toValue: { type: mongoose.Schema.Types.Mixed, default: null },
    schedule: { enabled: { type: Boolean, default: false }, runAt: { type: Date, default: null }, intervalSeconds: { type: Number, min: 60, default: null }, nextRunAt: { type: Date, default: null }, endAt: { type: Date, default: null }, timezone: { type: String, default: "UTC" } },
  },
  conditions: { type: [condition], default: [] }, conditionLogic: { type: String, enum: ["AND", "OR"], default: "AND" },
  steps: { type: [step], default: [] },
  status: { type: String, enum: ["ACTIVE", "INACTIVE", "DRAFT"], default: "DRAFT", index: true },
  execution: { maxRunsPerRecord: { type: Number, min: 1, default: 1 }, cooldownSeconds: { type: Number, min: 0, default: 0 }, stopOnError: { type: Boolean, default: true } },
  stats: { totalRuns: { type: Number, default: 0 }, successRuns: { type: Number, default: 0 }, failedRuns: { type: Number, default: 0 }, skippedRuns: { type: Number, default: 0 } },
  lastExecutedAt: { type: Date, default: null }, lastExecutionStatus: { type: String, enum: ["SUCCESS", "FAILED", "SKIPPED", null], default: null }, lastExecutionError: { type: String, maxlength: 2000, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
workflowSchema.index({ businessId: 1, status: 1 }); workflowSchema.index({ businessId: 1, "trigger.entity": 1, "trigger.event": 1 }); workflowSchema.index({ businessId: 1, "trigger.schedule.nextRunAt": 1, status: 1 });
registerModelEvents(workflowSchema, "workflow");

module.exports = mongoose.model("Workflow", workflowSchema);
