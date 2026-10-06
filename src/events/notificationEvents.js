const { subscribe } = require("./eventBus");
const Notification = require("../modules/notifications/notification.model");
const BusinessMember = require("../modules/business-members/business-member.model");
const User = require("../modules/users/user.model");
const Automation = require("../modules/automations/automation.model");

const ACTIONS = new Set(["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"]);

const TYPE_MAP = {
  lead: "LEAD",
  contact: "CONTACT",
  company: "COMPANY",
  deal: "DEAL",
  task: "TASK",
  activity: "ACTIVITY",
  meeting: "ACTIVITY",
  note: "SYSTEM",
  automation: "AUTOMATION",
  webhook: "WEBHOOK",
  workflow: "WORKFLOW",
  pipeline: "PIPELINE",
  team: "TEAM",
  "business-member": "TEAM",
  role: "ROLE",
  permission: "ROLE",
  "public-form": "FORM",
  file: "SYSTEM",
  "lead-source": "SOURCE",
  "lead-attribution": "LEAD",
  integration: "INTEGRATION",
  communication: "INTEGRATION",
  calendar: "ACTIVITY",
  setting: "SYSTEM",
  announcement: "SYSTEM",
  "custom-field": "SYSTEM",
  tag: "SYSTEM",
  qr: "FORM",
  invitation: "TEAM",
  report: "SYSTEM",
};

const LABELS = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  status_changed: "status changed",
  assigned: "assignment changed",
  stage_changed: "stage changed",
};

const URL_MAP = {
  lead: (id) => `/leads/${id}`,
  contact: (id) => `/contacts/${id}`,
  company: (id) => `/companies/${id}`,
  deal: (id) => `/deals/${id}`,
  task: () => `/tasks`,
  activity: () => `/activities`,
  meeting: () => `/meetings`,
  note: () => `/activities`,
  automation: () => `/automations`,
  workflow: () => `/workflows`,
  webhook: () => `/webhooks`,
  pipeline: () => `/pipelines`,
  tag: () => `/tags`,
  team: () => `/team`,
  "business-member": () => `/team/members`,
  role: () => `/team/roles`,
  permission: () => `/team/permissions`,
  "public-form": () => `/forms`,
  file: () => `/files`,
  "lead-source": () => `/sources-campaigns`,
  "lead-attribution": () => `/leads`,
  integration: () => `/integrations`,
  communication: () => `/communication-history`,
  calendar: () => `/calendar`,
  setting: () => `/settings`,
  announcement: () => `/announcements`,
  "custom-field": () => `/settings`,
  qr: () => `/forms`,
  invitation: () => `/team/members`,
  report: () => `/reports`,
};

const pretty = (value) =>
  String(value || "CRM")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const getActorName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.email ||
  "Business member";

const getRecordName = (record) =>
  record?.name ||
  record?.title ||
  record?.companyName ||
  record?.email ||
  record?.firstName ||
  record?._id ||
  null;

const initNotificationEvents = () => {
  subscribe("*", async (payload, event) => {
    try {
      const [entity, action] = String(event || "").toLowerCase().split(".");
      if (!payload?.businessId || !ACTIONS.has(action)) return;

      // A single save can emit updated + a more specific state-change event.
      // Keep the feed useful by storing only the specific event for that change.
      if (
        action === "updated" &&
        (payload?.changeFlags?.statusChanged ||
          payload?.changeFlags?.stageChanged ||
          payload?.changeFlags?.assignmentChanged)
      ) {
        return;
      }

      // Automation execution updates its own statistics. Those are internal
      // engine changes, not business activity that users need in the feed.
      if (entity === "automation" && payload?.automationId) return;

      const members = await BusinessMember.find({
        businessId: payload.businessId,
        status: "ACTIVE",
      })
        .select("userId")
        .lean();

      if (!members.length) return;

      const actorId = payload.actorId || null;
      const [actor, actorMember, automation] = await Promise.all([
        actorId ? User.findById(actorId).select("name firstName lastName email").lean() : null,
        actorId
          ? BusinessMember.findOne({
              businessId: payload.businessId,
              userId: actorId,
              status: "ACTIVE",
            })
              .populate("roleId", "name slug")
              .lean()
          : null,
        payload.automationId
          ? Automation.findOne({ _id: payload.automationId, businessId: payload.businessId })
              .select("name")
              .lean()
          : null,
      ]);

      const source = payload.automationId
        ? {
            type: "AUTOMATION",
            id: payload.automationId,
            name: automation?.name || "Automation",
            email: null,
            role: null,
          }
        : actorId
          ? {
              type: "USER",
              id: actorId,
              name: getActorName(actor),
              email: actor?.email || null,
              role: actorMember?.roleId?.name || actorMember?.roleId?.slug || null,
            }
          : {
              type: "SYSTEM",
              id: null,
              name: "BR30 CRM",
              email: null,
              role: "System",
            };

      const entityLabel = pretty(entity);
      const actionLabel = LABELS[action] || action;
      const recordName = getRecordName(payload.record);
      const title = `${entityLabel} ${actionLabel}`;
      const actorLabel = source.name || "BR30 CRM";
      const message = `${actorLabel} ${actionLabel} ${entityLabel}${recordName ? ` “${recordName}”` : ""}.`;
      const entityId = payload.entityId || null;
      const actionUrl = URL_MAP[entity]?.(entityId) || "/notifications";
      const type = TYPE_MAP[entity] || "SYSTEM";
      const priority = action === "deleted" || action === "assigned" ? "HIGH" : "NORMAL";

      const metadata = {
        event,
        actorId,
        automationId: payload.automationId || null,
        source: "crm-event",
      };

      await Notification.insertMany(
        members.map((member) => ({
          businessId: payload.businessId,
          recipientId: member.userId,
          type,
          title,
          message,
          priority,
          status: "UNREAD",
          actionUrl,
          entityType: String(payload.entity || entity).toLowerCase(),
          entityId,
          source,
          metadata,
          createdBy: actorId,
        }))
      );
    } catch (error) {
      console.error("Notification event error:", error.message);
    }
  });
};

module.exports = { initNotificationEvents };
