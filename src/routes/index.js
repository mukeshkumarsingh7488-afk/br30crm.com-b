const express = require("express");
const ApiResponse = require("../utils/ApiResponse");
const mongoose = require("mongoose");

const authRoutes = require("../modules/auth/auth.routes");
const businessRoutes = require("../modules/businesses/business.routes");
const businessMemberRoutes = require("../modules/business-members/business-member.routes");
const roleRoutes = require("../modules/roles/role.routes");
const permissionRoutes = require("../modules/permissions/permission.routes");
const userRoutes = require("../modules/users/user.routes");
const teamRoutes = require("../modules/teams/team.routes");
const invitationRoutes = require("../modules/invitations/invitation.routes");
const leadRoutes = require("../modules/leads/lead.routes");
const contactRoutes = require("../modules/contacts/contact.routes");
const companyRoutes = require("../modules/companies/company.routes");
const pipelineRoutes = require("../modules/pipelines/pipeline.routes");
const dealRoutes = require("../modules/deals/deal.routes");
const activityRoutes = require("../modules/activities/activity.routes");
const taskRoutes = require("../modules/tasks/task.routes");
const noteRoutes = require("../modules/notes/note.routes");
const tagRoutes = require("../modules/tags/tag.routes");
const customFieldRoutes = require("../modules/custom-fields/custom-field.routes");
const apiKeyRoutes = require("../modules/api-keys/api-key.routes");
const integrationRoutes = require("../modules/integrations/integration.routes");
const webhookRoutes = require("../modules/webhooks/webhook.routes");
const automationRoutes = require("../modules/automations/automation.routes");
const workflowRoutes = require("../modules/workflows/workflow.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const announcementRoutes = require("../modules/announcements/announcement.route");
const fileRoutes = require("../modules/files/file.routes");
const analyticsRoutes = require("../modules/analytics/analytics.routes");
const auditRoutes = require("../modules/audit/audit.routes");
const settingRoutes = require("../modules/settings/setting.routes");
const whatsNewRoutes = require("../modules/whats-new/whats-new.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const searchRoutes = require("../modules/search/search.routes");
const importExportRoutes = require("../modules/import-export/import-export.routes");
const duplicateRoutes = require("../modules/duplicates/duplicate.routes");
const reportRoutes = require("../modules/reports/report.routes");
const sessionRoutes = require("../modules/sessions/session.routes");
const publicFormRoutes = require("../modules/public-forms/public-form.routes");
const qrRoutes = require("../modules/qr/qr.routes");
const meetingRoutes = require("../modules/meetings/meeting.routes");
const calendarRoutes = require("../modules/calendar/calendar.routes");
const calendarAccountRoutes = require("../modules/calendar/calendar-account.routes");
const calendarAvailabilityRoutes = require("../modules/calendar/calendar-availability.routes");
const communicationRoutes = require("../modules/communications/communication.routes");
const socialLeadRoutes = require("../modules/social-leads/social-lead.routes");
const leadSourceRoutes = require("../modules/lead-sources/lead-source.routes");
const leadAttributionRoutes = require("../modules/lead-attribution/lead-attribution.routes");
const subscriptionRoutes = require("../modules/subscriptions/subscription.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  const payload = {
    service: "BR30 CRM API",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    requestId: req.requestId || null,
    uptimeSeconds: Math.floor(process.uptime()),
    database: databaseReady ? "UP" : "DOWN",
  };

  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? "API is healthy" : "API is degraded",
    data: payload,
  });
});

router.use("/auth", authRoutes);
router.use("/businesses", businessRoutes);
router.use("/business-members", businessMemberRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/invitations", invitationRoutes);
router.use("/leads", leadRoutes);
router.use("/contacts", contactRoutes);
router.use("/companies", companyRoutes);
router.use("/pipelines", pipelineRoutes);
router.use("/deals", dealRoutes);
router.use("/activities", activityRoutes);
router.use("/tasks", taskRoutes);
router.use("/notes", noteRoutes);
router.use("/tags", tagRoutes);
router.use("/custom-fields", customFieldRoutes);
router.use("/api-keys", apiKeyRoutes);
router.use("/integrations", integrationRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/automations", automationRoutes);
router.use("/workflows", workflowRoutes);
router.use("/notifications", notificationRoutes);
router.use("/announcements", announcementRoutes);
router.use("/files", fileRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/audit", auditRoutes);
router.use("/settings", settingRoutes);
router.use("/whatsnew", whatsNewRoutes);
router.use("/admin", adminRoutes);
router.use("/search", searchRoutes);
router.use("/import-export", importExportRoutes);
router.use("/duplicates", duplicateRoutes);
router.use("/reports", reportRoutes);
router.use("/sessions", sessionRoutes);
router.use("/public-forms", publicFormRoutes);
router.use("/qr", qrRoutes);
router.use("/meetings", meetingRoutes);
router.use("/calendar", calendarRoutes);
router.use("/calendar-accounts", calendarAccountRoutes);
router.use("/calendar-availability", calendarAvailabilityRoutes);
router.use("/communications", communicationRoutes);
router.use("/social-leads", socialLeadRoutes);
router.use("/lead-sources", leadSourceRoutes);
router.use("/lead-attribution", leadAttributionRoutes);
router.use("/subscriptions", subscriptionRoutes);

module.exports = router;
