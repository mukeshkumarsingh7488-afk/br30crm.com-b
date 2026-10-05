const mongoose = require("mongoose");

const automationExecutionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: "Automation", required: true, index: true },
  entity: { type: String, default: null, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  event: { type: String, default: null, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: ["RUNNING", "SUCCESS", "FAILED", "SKIPPED"], default: "RUNNING", index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  durationMs: { type: Number, default: null },
  error: { type: String, maxlength: 4000, default: null },
  actionResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, versionKey: false });

automationExecutionSchema.index({ businessId: 1, automationId: 1, createdAt: -1 });
automationExecutionSchema.index({ businessId: 1, entity: 1, entityId: 1, automationId: 1, createdAt: -1 });

module.exports = mongoose.model("AutomationExecution", automationExecutionSchema);
