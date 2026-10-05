const { subscribe } = require("./eventBus");
const Notification = require("../modules/notifications/notification.model");
const BusinessMember = require("../modules/business-members/business-member.model");

const ACTIONS = new Set(["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"]);
const TYPE_MAP = {
  lead: "LEAD", contact: "CONTACT", company: "COMPANY", deal: "DEAL", task: "TASK", activity: "ACTIVITY",
  automation: "AUTOMATION", webhook: "WEBHOOK", workflow: "SYSTEM", meeting: "ACTIVITY", note: "SYSTEM",
};
const LABELS = { created: "created", updated: "updated", deleted: "deleted", status_changed: "status changed", assigned: "assignment changed", stage_changed: "stage changed" };
const URL_MAP = {
  lead: (id) => `/leads/${id}`, contact: (id) => `/contacts/${id}`, company: (id) => `/companies/${id}`, deal: (id) => `/deals/${id}`,
  task: () => `/tasks`, activity: () => `/activities`, meeting: () => `/meetings`, automation: () => `/automations`, workflow: () => `/workflows`,
  webhook: () => `/webhooks`, note: () => `/activities`, pipeline: () => `/pipelines`, tag: () => `/tags`, team: () => `/team`,
  "business-member": () => `/team/members`, role: () => `/team/roles`, permission: () => `/team/permissions`,
  "public-form": () => `/forms`, "lead-source": () => `/sources-campaigns`, integration: () => `/integrations`,
  setting: () => `/settings`, calendar: () => `/calendar`, communication: () => `/communication-history`,
};

const pretty = (value) => String(value || "CRM").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const initNotificationEvents = () => {
  subscribe("*", async (payload, event) => {
    try {
      const [entity, action] = String(event || "").toLowerCase().split(".");
      if (!payload?.businessId || !ACTIONS.has(action)) return;

      const members = await BusinessMember.find({ businessId: payload.businessId, status: "ACTIVE" }).select("userId").lean();
      if (!members.length) return;

      const title = `${pretty(entity)} ${LABELS[action] || action}`;
      const message = `${pretty(entity)} ${LABELS[action] || action} in your BR30 CRM workspace.`;
      const entityId = payload.entityId || null;
      const actionUrl = URL_MAP[entity]?.(entityId) || null;
      const type = TYPE_MAP[entity] || "SYSTEM";
      const priority = action === "deleted" ? "HIGH" : action === "assigned" ? "HIGH" : "NORMAL";

      await Notification.insertMany(members.map((member) => ({
        businessId: payload.businessId,
        recipientId: member.userId,
        type,
        title,
        message,
        priority,
        status: "UNREAD",
        actionUrl,
        entityType: payload.entity || entity,
        entityId,
        metadata: { event, actorId: payload.actorId || null, source: "crm-event" },
        createdBy: payload.actorId || null,
      })));
    } catch (error) {
      console.error("Notification event error:", error.message);
    }
  });
};

module.exports = { initNotificationEvents };
