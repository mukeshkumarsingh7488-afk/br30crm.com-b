const { subscribe } = require("../events/eventBus");
const { processEvent, runScheduledAutomations } = require("./engine");
const { processWorkflowEvent, runScheduledWorkflows } = require("../modules/workflows/workflow.engine");
const { queueEvent } = require("../modules/webhooks/webhook-delivery.service");
const { createAuditLog } = require("../modules/audit/audit.service");
const { initNotificationEvents } = require("../events/notificationEvents");
let initialized = false;
const initAutomationEngine = () => {
  if (initialized) return;
  initialized = true;
  initNotificationEvents();
  subscribe("*", async (payload, event) => {
    try {
      const [module, action] = String(event || "").split(".");
      const auditable = ["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"].includes(action);
      if (auditable && payload?.businessId) {
        await createAuditLog({ businessId: payload.businessId, actorId: payload.actorId || null, action, module, entityType: payload.entity || module, entityId: payload.entityId || null, description: `${module} ${action}`, metadata: { source: "eventBus", automationId: payload.automationId || null } });
      }
    } catch (error) { console.error("Audit event error:", error.message); }
    try { await processEvent(payload, event); } catch (error) { console.error("Automation engine error:", error.message); }
    try { await processWorkflowEvent(payload, event); } catch (error) { console.error("Workflow engine error:", error.message); }
    try { await queueEvent(event, payload); } catch (error) { console.error("Webhook dispatch error:", error.message); }
  });
};
const runAutomationScheduler = async () => { await runScheduledAutomations(25); await runScheduledWorkflows(25); };
module.exports = { initAutomationEngine, runAutomationScheduler };
