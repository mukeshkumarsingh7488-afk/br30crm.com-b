const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const Permission = require("./permission.model");
const BusinessPermissionState = require("./business-permission-state.model");

const LEGACY_SYSTEM_PERMISSION_SLUGS = new Set([
  "members.view",
  "members.create",
  "members.update",
  "members.delete",
  "qr.view",
  "qr.create",
  "qr.update",
  "qr.delete",
  "roles.activate",
  "roles.deactivate",
  "email.view",
  "email.send",
  "sms.view",
  "sms.send",
  "whatsapp.view",
  "whatsapp.send",
  "leads.export",
  "contacts.export",
  "companies.export",
  "deals.export",
  "analytics.export",
  "users.assign",
  "meetings.cancel",
  "meetings.complete",
  "meetings.join",
]);

const SYSTEM_PERMISSIONS = [
  {
    name: "Dashboard View",
    slug: "dashboard.view",
    module: "dashboard",
    action: "view",
    description: "View CRM dashboard and business metrics.",
  },
  {
    name: "Leads View",
    slug: "leads.view",
    module: "leads",
    action: "view",
    description: "View leads.",
  },
  {
    name: "Leads Create",
    slug: "leads.create",
    module: "leads",
    action: "create",
    description: "Create new leads.",
  },
  {
    name: "Leads Update",
    slug: "leads.update",
    module: "leads",
    action: "update",
    description: "Update leads.",
  },
  {
    name: "Leads Delete",
    slug: "leads.delete",
    module: "leads",
    action: "delete",
    description: "Delete leads.",
  },

  {
    name: "Leads Assign",
    slug: "leads.assign",
    module: "leads",
    action: "assign",
    description: "Assign leads to team members.",
  },
  {
    name: "Leads Convert",
    slug: "leads.convert",
    module: "leads",
    action: "convert",
    description: "Convert leads into contacts and companies.",
  },
  {
    name: "Lead Sources View",
    slug: "lead-sources.view",
    module: "lead-sources",
    action: "view",
    description: "View lead sources and campaigns.",
  },

  {
    name: "Lead Sources Create",
    slug: "lead-sources.create",
    module: "lead-sources",
    action: "create",
    description: "Create lead sources and campaigns.",
  },

  {
    name: "Lead Sources Update",
    slug: "lead-sources.update",
    module: "lead-sources",
    action: "update",
    description: "Update lead sources and campaigns.",
  },

  {
    name: "Lead Sources Delete",
    slug: "lead-sources.delete",
    module: "lead-sources",
    action: "delete",
    description: "Delete lead sources and campaigns.",
  },
  {
    name: "Lead Attribution View",
    slug: "lead-attribution.view",
    module: "lead-attribution",
    action: "view",
    description: "View lead attribution data.",
  },

  {
    name: "Lead Attribution Create",
    slug: "lead-attribution.create",
    module: "lead-attribution",
    action: "create",
    description: "Create lead attribution records.",
  },

  {
    name: "Lead Attribution Update",
    slug: "lead-attribution.update",
    module: "lead-attribution",
    action: "update",
    description: "Update lead attribution records.",
  },

  {
    name: "Lead Attribution Delete",
    slug: "lead-attribution.delete",
    module: "lead-attribution",
    action: "delete",
    description: "Delete lead attribution records.",
  },
  {
    name: "Notifications Create",
    slug: "notifications.create",
    module: "notifications",
    action: "create",
    description: "Create notifications.",
  },
  {
    name: "Notifications Update",
    slug: "notifications.update",
    module: "notifications",
    action: "update",
    description: "Update notifications.",
  },
  {
    name: "Notifications Delete",
    slug: "notifications.delete",
    module: "notifications",
    action: "delete",
    description: "Delete notifications.",
  },
  {
    name: "Analytics Create",
    slug: "analytics.create",
    module: "analytics",
    action: "create",
    description: "Create analytics.",
  },
  {
    name: "Analytics Delete",
    slug: "analytics.delete",
    module: "analytics",
    action: "delete",
    description: "Delete analytics.",
  },
  {
    name: "What's New View",
    slug: "whatsnew.view",
    module: "whatsnew",
    action: "view",
    description: "View What's New updates.",
  },
  {
    name: "What's New Create",
    slug: "whatsnew.create",
    module: "whatsnew",
    action: "create",
    description: "Create What's New updates.",
  },
  {
    name: "What's New Update",
    slug: "whatsnew.update",
    module: "whatsnew",
    action: "update",
    description: "Update What's New updates.",
  },
  {
    name: "What's New Delete",
    slug: "whatsnew.delete",
    module: "whatsnew",
    action: "delete",
    description: "Delete What's New updates.",
  },
  {
    name: "Contacts View",
    slug: "contacts.view",
    module: "contacts",
    action: "view",
    description: "View contacts.",
  },
  {
    name: "Contacts Create",
    slug: "contacts.create",
    module: "contacts",
    action: "create",
    description: "Create contacts.",
  },
  {
    name: "Contacts Update",
    slug: "contacts.update",
    module: "contacts",
    action: "update",
    description: "Update contacts.",
  },
  {
    name: "Contacts Delete",
    slug: "contacts.delete",
    module: "contacts",
    action: "delete",
    description: "Delete contacts.",
  },

  {
    name: "Contacts Assign",
    slug: "contacts.assign",
    module: "contacts",
    action: "assign",
    description: "Assign contacts to team members.",
  },
  {
    name: "Companies View",
    slug: "companies.view",
    module: "companies",
    action: "view",
    description: "View companies.",
  },
  {
    name: "Companies Create",
    slug: "companies.create",
    module: "companies",
    action: "create",
    description: "Create companies.",
  },
  {
    name: "Companies Update",
    slug: "companies.update",
    module: "companies",
    action: "update",
    description: "Update companies.",
  },
  {
    name: "Companies Delete",
    slug: "companies.delete",
    module: "companies",
    action: "delete",
    description: "Delete companies.",
  },

  {
    name: "Companies Assign",
    slug: "companies.assign",
    module: "companies",
    action: "assign",
    description: "Assign companies to team members.",
  },
  {
    name: "Deals View",
    slug: "deals.view",
    module: "deals",
    action: "view",
    description: "View deals and opportunities.",
  },
  {
    name: "Deals Create",
    slug: "deals.create",
    module: "deals",
    action: "create",
    description: "Create deals.",
  },
  {
    name: "Deals Update",
    slug: "deals.update",
    module: "deals",
    action: "update",
    description: "Update deals.",
  },
  {
    name: "Deals Delete",
    slug: "deals.delete",
    module: "deals",
    action: "delete",
    description: "Delete deals.",
  },

  {
    name: "Deals Assign",
    slug: "deals.assign",
    module: "deals",
    action: "assign",
    description: "Assign deals to team members.",
  },
  {
    name: "Pipelines View",
    slug: "pipelines.view",
    module: "pipelines",
    action: "view",
    description: "View sales pipelines.",
  },
  {
    name: "Pipelines Create",
    slug: "pipelines.create",
    module: "pipelines",
    action: "create",
    description: "Create pipelines.",
  },
  {
    name: "Pipelines Update",
    slug: "pipelines.update",
    module: "pipelines",
    action: "update",
    description: "Update pipelines.",
  },
  {
    name: "Pipelines Delete",
    slug: "pipelines.delete",
    module: "pipelines",
    action: "delete",
    description: "Delete pipelines.",
  },
  {
    name: "Activities View",
    slug: "activities.view",
    module: "activities",
    action: "view",
    description: "View activities.",
  },
  {
    name: "Activities Create",
    slug: "activities.create",
    module: "activities",
    action: "create",
    description: "Create activities.",
  },
  {
    name: "Activities Update",
    slug: "activities.update",
    module: "activities",
    action: "update",
    description: "Update activities.",
  },
  {
    name: "Activities Delete",
    slug: "activities.delete",
    module: "activities",
    action: "delete",
    description: "Delete activities.",
  },
  {
    name: "Activities Complete",
    slug: "activities.complete",
    module: "activities",
    action: "complete",
    description: "Mark activities as complete.",
  },
  {
    name: "Tasks View",
    slug: "tasks.view",
    module: "tasks",
    action: "view",
    description: "View tasks.",
  },
  {
    name: "Tasks Create",
    slug: "tasks.create",
    module: "tasks",
    action: "create",
    description: "Create tasks.",
  },
  {
    name: "Tasks Update",
    slug: "tasks.update",
    module: "tasks",
    action: "update",
    description: "Update tasks.",
  },
  {
    name: "Tasks Delete",
    slug: "tasks.delete",
    module: "tasks",
    action: "delete",
    description: "Delete tasks.",
  },
  {
    name: "Tasks Assign",
    slug: "tasks.assign",
    module: "tasks",
    action: "assign",
    description: "Assign tasks to team members.",
  },
  {
    name: "Tasks Complete",
    slug: "tasks.complete",
    module: "tasks",
    action: "complete",
    description: "Mark tasks as complete.",
  },
  {
    name: "Notes View",
    slug: "notes.view",
    module: "notes",
    action: "view",
    description: "View notes.",
  },
  {
    name: "Notes Create",
    slug: "notes.create",
    module: "notes",
    action: "create",
    description: "Create notes.",
  },
  {
    name: "Notes Update",
    slug: "notes.update",
    module: "notes",
    action: "update",
    description: "Update notes.",
  },
  {
    name: "Notes Delete",
    slug: "notes.delete",
    module: "notes",
    action: "delete",
    description: "Delete notes.",
  },
  {
    name: "Tags View",
    slug: "tags.view",
    module: "tags",
    action: "view",
    description: "View tags.",
  },
  {
    name: "Tags Create",
    slug: "tags.create",
    module: "tags",
    action: "create",
    description: "Create tags.",
  },
  {
    name: "Tags Update",
    slug: "tags.update",
    module: "tags",
    action: "update",
    description: "Update tags.",
  },
  {
    name: "Tags Delete",
    slug: "tags.delete",
    module: "tags",
    action: "delete",
    description: "Delete tags.",
  },
  {
    name: "Custom Fields View",
    slug: "custom-fields.view",
    module: "custom-fields",
    action: "view",
    description: "View custom fields.",
  },
  {
    name: "Custom Fields Create",
    slug: "custom-fields.create",
    module: "custom-fields",
    action: "create",
    description: "Create custom fields.",
  },
  {
    name: "Custom Fields Update",
    slug: "custom-fields.update",
    module: "custom-fields",
    action: "update",
    description: "Update custom fields.",
  },
  {
    name: "Custom Fields Delete",
    slug: "custom-fields.delete",
    module: "custom-fields",
    action: "delete",
    description: "Delete custom fields.",
  },
  {
    name: "Users View",
    slug: "users.view",
    module: "users",
    action: "view",
    description: "View business users.",
  },
  {
    name: "Users Create",
    slug: "users.create",
    module: "users",
    action: "create",
    description: "Create or add users to a business.",
  },
  {
    name: "Users Update",
    slug: "users.update",
    module: "users",
    action: "update",
    description: "Update business users.",
  },
  {
    name: "Users Delete",
    slug: "users.delete",
    module: "users",
    action: "delete",
    description: "Remove users from a business.",
  },
  {
    name: "Teams View",
    slug: "teams.view",
    module: "teams",
    action: "view",
    description: "View teams.",
  },
  {
    name: "Teams Create",
    slug: "teams.create",
    module: "teams",
    action: "create",
    description: "Create teams.",
  },
  {
    name: "Teams Update",
    slug: "teams.update",
    module: "teams",
    action: "update",
    description: "Update teams.",
  },
  {
    name: "Teams Delete",
    slug: "teams.delete",
    module: "teams",
    action: "delete",
    description: "Delete teams.",
  },
  {
    name: "Roles View",
    slug: "roles.view",
    module: "roles",
    action: "view",
    description: "View business roles.",
  },
  {
    name: "Roles Create",
    slug: "roles.create",
    module: "roles",
    action: "create",
    description: "Create business roles.",
  },
  {
    name: "Roles Update",
    slug: "roles.update",
    module: "roles",
    action: "update",
    description: "Update business roles.",
  },
  {
    name: "Roles Delete",
    slug: "roles.delete",
    module: "roles",
    action: "delete",
    description: "Deactivate business roles.",
  },
  {
    name: "Permissions View",
    slug: "permissions.view",
    module: "permissions",
    action: "view",
    description: "View available permissions.",
  },
  {
    name: "Permissions Manage",
    slug: "permissions.manage",
    module: "permissions",
    action: "manage",
    description: "Manage permissions.",
  },
  {
    name: "Permissions Add",
    slug: "permissions.add",
    module: "permissions",
    action: "add",
    description: "Add new permissions.",
  },
  {
    name: "Forms View",
    slug: "forms.view",
    module: "forms",
    action: "view",
    description: "View public forms and QR codes.",
  },
  {
    name: "Forms Create",
    slug: "forms.create",
    module: "forms",
    action: "create",
    description: "Create public forms and QR codes.",
  },
  {
    name: "Forms Update",
    slug: "forms.update",
    module: "forms",
    action: "update",
    description: "Update public forms and QR codes.",
  },
  {
    name: "Forms Delete",
    slug: "forms.delete",
    module: "forms",
    action: "delete",
    description: "Delete public forms and QR codes.",
  },
  {
    name: "Integrations View",
    slug: "integrations.view",
    module: "integrations",
    action: "view",
    description: "View integrations.",
  },
  {
    name: "Integrations Create",
    slug: "integrations.create",
    module: "integrations",
    action: "create",
    description: "Create integrations.",
  },
  {
    name: "Integrations Update",
    slug: "integrations.update",
    module: "integrations",
    action: "update",
    description: "Update integrations.",
  },
  {
    name: "Integrations Delete",
    slug: "integrations.delete",
    module: "integrations",
    action: "delete",
    description: "Delete integrations.",
  },
  {
    name: "Webhooks View",
    slug: "webhooks.view",
    module: "webhooks",
    action: "view",
    description: "View webhooks.",
  },
  {
    name: "Webhooks Create",
    slug: "webhooks.create",
    module: "webhooks",
    action: "create",
    description: "Create webhooks.",
  },
  {
    name: "Webhooks Update",
    slug: "webhooks.update",
    module: "webhooks",
    action: "update",
    description: "Update webhooks.",
  },
  {
    name: "Webhooks Delete",
    slug: "webhooks.delete",
    module: "webhooks",
    action: "delete",
    description: "Delete webhooks.",
  },
  {
    name: "Automations View",
    slug: "automations.view",
    module: "automations",
    action: "view",
    description: "View automations.",
  },
  {
    name: "Automations Create",
    slug: "automations.create",
    module: "automations",
    action: "create",
    description: "Create automations.",
  },
  {
    name: "Automations Update",
    slug: "automations.update",
    module: "automations",
    action: "update",
    description: "Update automations.",
  },
  {
    name: "Automations Delete",
    slug: "automations.delete",
    module: "automations",
    action: "delete",
    description: "Delete automations.",
  },
  {
    name: "Automations Execute",
    slug: "automations.execute",
    module: "automations",
    action: "execute",
    description: "Execute automation workflows.",
  },
  {
    name: "Workflows View",
    slug: "workflows.view",
    module: "workflows",
    action: "view",
    description: "View workflows.",
  },
  {
    name: "Workflows Create",
    slug: "workflows.create",
    module: "workflows",
    action: "create",
    description: "Create workflows.",
  },
  {
    name: "Workflows Update",
    slug: "workflows.update",
    module: "workflows",
    action: "update",
    description: "Update workflows.",
  },
  {
    name: "Workflows Delete",
    slug: "workflows.delete",
    module: "workflows",
    action: "delete",
    description: "Delete workflows.",
  },
  {
    name: "Workflows Execute",
    slug: "workflows.execute",
    module: "workflows",
    action: "execute",
    description: "Execute workflows.",
  },
  {
    name: "Notifications View",
    slug: "notifications.view",
    module: "notifications",
    action: "view",
    description: "View notifications.",
  },
  {
    name: "Notifications Manage",
    slug: "notifications.manage",
    module: "notifications",
    action: "manage",
    description: "Manage notification settings.",
  },
  {
    name: "Files View",
    slug: "files.view",
    module: "files",
    action: "view",
    description: "View files and attachments.",
  },
  {
    name: "Files Create",
    slug: "files.create",
    module: "files",
    action: "create",
    description: "Upload files.",
  },
  {
    name: "Files Update",
    slug: "files.update",
    module: "files",
    action: "update",
    description: "Update file metadata and attachments.",
  },
  {
    name: "Files Delete",
    slug: "files.delete",
    module: "files",
    action: "delete",
    description: "Delete files.",
  },
  {
    name: "Analytics View",
    slug: "analytics.view",
    module: "analytics",
    action: "view",
    description: "View business analytics and reports.",
  },
  {
    name: "Audit View",
    slug: "audit.view",
    module: "audit",
    action: "view",
    description: "View audit logs.",
  },
  {
    name: "API Keys View",
    slug: "api-keys.view",
    module: "api-keys",
    action: "view",
    description: "View business API keys.",
  },
  {
    name: "API Keys Create",
    slug: "api-keys.create",
    module: "api-keys",
    action: "create",
    description: "Create business API keys.",
  },
  {
    name: "API Keys Update",
    slug: "api-keys.update",
    module: "api-keys",
    action: "update",
    description: "Update business API keys.",
  },
  {
    name: "API Keys Delete",
    slug: "api-keys.delete",
    module: "api-keys",
    action: "delete",
    description: "Revoke business API keys.",
  },
  {
    name: "Invitations View",
    slug: "invitations.view",
    module: "invitations",
    action: "view",
    description: "View business invitations.",
  },
  {
    name: "Invitations Create",
    slug: "invitations.create",
    module: "invitations",
    action: "create",
    description: "Create and send invitations.",
  },
  {
    name: "Invitations Delete",
    slug: "invitations.delete",
    module: "invitations",
    action: "delete",
    description: "Cancel invitations.",
  },
  {
    name: "Settings View",
    slug: "settings.view",
    module: "settings",
    action: "view",
    description: "View business settings.",
  },
  {
    name: "Settings Create",
    slug: "settings.create",
    module: "settings",
    action: "create",
    description: "Create business settings.",
  },
  {
    name: "Settings Update",
    slug: "settings.update",
    module: "settings",
    action: "update",
    description: "Update business settings.",
  },
  {
    name: "Search View",
    slug: "search.view",
    module: "search",
    action: "view",
    description: "Search CRM records across the business.",
  },
  {
    name: "Imports View",
    slug: "imports.view",
    module: "imports",
    action: "view",
    description: "View import/export jobs.",
  },
  {
    name: "Imports Create",
    slug: "imports.create",
    module: "imports",
    action: "create",
    description: "Import CRM records.",
  },
  {
    name: "Exports Create",
    slug: "exports.create",
    module: "exports",
    action: "create",
    description: "Export CRM records.",
  },
  {
    name: "Duplicates View",
    slug: "duplicates.view",
    module: "duplicates",
    action: "view",
    description: "View duplicate candidates.",
  },
  {
    name: "Duplicates Manage",
    slug: "duplicates.manage",
    module: "duplicates",
    action: "manage",
    description: "Scan, merge, or ignore duplicate candidates.",
  },
  {
    name: "Reports View",
    slug: "reports.view",
    module: "reports",
    action: "view",
    description: "View and execute saved reports.",
  },
  {
    name: "Reports Create",
    slug: "reports.create",
    module: "reports",
    action: "create",
    description: "Create saved reports.",
  },
  {
    name: "Reports Update",
    slug: "reports.update",
    module: "reports",
    action: "update",
    description: "Update saved reports.",
  },
  {
    name: "Reports Delete",
    slug: "reports.delete",
    module: "reports",
    action: "delete",
    description: "Delete saved reports.",
  },
  {
    name: "Meetings View",
    slug: "meetings.view",
    module: "meetings",
    action: "view",
    description: "View meetings and calendar events.",
  },
  {
    name: "Meetings Create",
    slug: "meetings.create",
    module: "meetings",
    action: "create",
    description: "Create meetings.",
  },
  {
    name: "Meetings Update",
    slug: "meetings.update",
    module: "meetings",
    action: "update",
    description: "Update meetings.",
  },

  {
    name: "Meetings Delete",
    slug: "meetings.delete",
    module: "meetings",
    action: "delete",
    description: "Delete meetings.",
  },
  {
    name: "Calendar View",
    slug: "calendar.view",
    module: "calendar",
    action: "view",
    description: "View CRM calendar events and unified calendar data.",
  },
  {
    name: "Calendar Create",
    slug: "calendar.create",
    module: "calendar",
    action: "create",
    description: "Create calendar events.",
  },
  {
    name: "Calendar Update",
    slug: "calendar.update",
    module: "calendar",
    action: "update",
    description: "Update calendar events.",
  },
  {
    name: "Calendar Delete",
    slug: "calendar.delete",
    module: "calendar",
    action: "delete",
    description: "Delete calendar events.",
  },
  {
    name: "Calendar Accounts View",
    slug: "calendar.accounts.view",
    module: "calendar",
    action: "accounts.view",
    description: "View connected external calendar accounts.",
  },
  {
    name: "Calendar Accounts Manage",
    slug: "calendar.accounts.manage",
    module: "calendar",
    action: "accounts.manage",
    description: "Connect and disconnect external calendar accounts.",
  },
  {
    name: "Calendar Availability View",
    slug: "calendar.availability.view",
    module: "calendar",
    action: "availability.view",
    description: "View calendar availability.",
  },
  {
    name: "Calendar Availability Manage",
    slug: "calendar.availability.manage",
    module: "calendar",
    action: "availability.manage",
    description: "Manage calendar availability and working hours.",
  },
  {
    name: "Sales Report View",
    slug: "sales-report.view",
    module: "sales-report",
    action: "view",
    description: "View sales reports.",
  },
  {
    name: "Leads Report View",
    slug: "leads-report.view",
    module: "leads-report",
    action: "view",
    description: "View leads reports.",
  },
  {
    name: "Deals Report View",
    slug: "deals-report.view",
    module: "deals-report",
    action: "view",
    description: "View deals reports.",
  },
  {
    name: "Activities Report View",
    slug: "activities-report.view",
    module: "activities-report",
    action: "view",
    description: "View activities reports.",
  },
  {
    name: "Communications View",
    slug: "communications.view",
    module: "communications",
    action: "view",
    description: "View outbound and inbound CRM communications.",
  },
  {
    name: "Communications Send",
    slug: "communications.send",
    module: "communications",
    action: "send",
    description: "Send email, WhatsApp and SMS messages.",
  },
];

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const normalizeSlug = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

const getPermissionById = async (permissionId, businessId = null) => {
  validateObjectId(permissionId, "permission ID");

  if (businessId !== null) validateObjectId(businessId, "business ID");

  const filter = { _id: permissionId };
  if (businessId !== null)
    filter.$or = [
      { businessId: null, type: "SYSTEM" },
      { businessId, type: "CUSTOM" },
    ];

  const permission = await Permission.findOne(filter);

  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }

  if (permission.type === "SYSTEM" && businessId !== null) {
    const state = await BusinessPermissionState.findOne({ businessId, permissionId: permission._id }).select("isActive").lean();
    permission.isActive = permission.isActive !== false && (state ? state.isActive !== false : true);
  }

  return permission;
};

const getPermissionBySlug = async (slug, businessId = null) => {
  if (!slug || !String(slug).trim()) {
    throw new ApiError(400, "Permission slug is required.");
  }

  if (businessId !== null) validateObjectId(businessId, "business ID");

  const filter = { slug: String(slug).trim().toLowerCase() };
  if (businessId !== null)
    filter.$or = [
      { businessId: null, type: "SYSTEM" },
      { businessId, type: "CUSTOM" },
    ];

  const permission = await Permission.findOne(filter);

  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }

  if (permission.type === "SYSTEM" && businessId !== null) {
    const state = await BusinessPermissionState.findOne({ businessId, permissionId: permission._id }).select("isActive").lean();
    permission.isActive = permission.isActive !== false && (state ? state.isActive !== false : true);
  }

  return permission;
};

const createPermission = async ({ name, description, module, action, type = "CUSTOM", businessId = null, createdBy }) => {
  validateObjectId(createdBy, "creator ID");

  if (!name || !String(name).trim()) {
    throw new ApiError(400, "Permission name is required.");
  }

  if (!module || !String(module).trim()) {
    throw new ApiError(400, "Permission module is required.");
  }

  if (!action || !String(action).trim()) {
    throw new ApiError(400, "Permission action is required.");
  }

  if (type !== "CUSTOM") {
    throw new ApiError(403, "Only custom business permissions can be created through this endpoint.");
  }

  if (businessId) {
    validateObjectId(businessId, "business ID");
  }

  const normalizedModule = String(module).trim().toLowerCase();
  const normalizedAction = String(action).trim().toLowerCase();
  const slug = `${normalizedModule}.${normalizedAction}`;

  const systemPermission = await Permission.findOne({
    businessId: null,
    type: "SYSTEM",
    slug,
  })
    .select("_id isActive")
    .lean();

  if (systemPermission) {
    throw new ApiError(409, "This permission slug is reserved by the CRM system.");
  }

  const existingPermission = await Permission.findOne({
    businessId: businessId || null,
    slug,
  });

  if (existingPermission) {
    throw new ApiError(409, "A permission with this module and action already exists.");
  }

  const permission = await Permission.create({
    name: String(name).trim(),
    slug,
    description: description ? String(description).trim() : null,
    module: normalizedModule,
    action: normalizedAction,
    type,
    businessId: businessId || null,
    isActive: true,
    createdBy,
    updatedBy: createdBy,
  });

  return permission;
};

const initializeSystemPermissions = async ({ createdBy }) => {
  validateObjectId(createdBy, "creator ID");

  const permissions = [];

  for (const permissionData of SYSTEM_PERMISSIONS) {
    let permission = await Permission.findOne({
      slug: permissionData.slug,
      businessId: null,
    });

    if (!permission) {
      permission = await Permission.create({
        name: permissionData.name,
        slug: permissionData.slug,
        description: permissionData.description || null,
        module: permissionData.module,
        action: permissionData.action,
        type: "SYSTEM",
        businessId: null,
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      });
    } else {
      let changed = false;

      if (permission.name !== permissionData.name) {
        permission.name = permissionData.name;
        changed = true;
      }

      if (permission.description !== (permissionData.description || null)) {
        permission.description = permissionData.description || null;
        changed = true;
      }

      if (permission.module !== permissionData.module) {
        permission.module = permissionData.module;
        changed = true;
      }

      if (permission.action !== permissionData.action) {
        permission.action = permissionData.action;
        changed = true;
      }

      if (permission.type !== "SYSTEM") {
        permission.type = "SYSTEM";
        changed = true;
      }

      if (permission.isActive !== true) {
        permission.isActive = true;
        changed = true;
      }

      if (permission.businessId !== null) {
        permission.businessId = null;
        changed = true;
      }

      if (changed) {
        permission.updatedBy = createdBy;
        await permission.save();
      }
    }

    permissions.push(permission);
  }

  const legacySlugs = [...LEGACY_SYSTEM_PERMISSION_SLUGS];

  await Permission.updateMany({ businessId: null, type: "SYSTEM", slug: { $in: legacySlugs }, isActive: true }, { $set: { isActive: false, updatedBy: createdBy } });

  return permissions;
};

const getSystemPermissions = async ({ includeInactive = false, createdBy = null, businessId = null } = {}) => {
  if (createdBy) {
    await initializeSystemPermissions({ createdBy });
  }

  if (businessId !== null) validateObjectId(businessId, "business ID");

  const filter = {
    businessId: null,
    type: "SYSTEM",
    slug: { $nin: [...LEGACY_SYSTEM_PERMISSION_SLUGS] },
  };

  const permissions = await Permission.find(filter).sort({ module: 1, action: 1, name: 1 }).lean();

  if (businessId === null || permissions.length === 0) {
    return includeInactive ? permissions : permissions.filter((permission) => permission.isActive !== false);
  }

  const states = await BusinessPermissionState.find({
    businessId,
    permissionId: { $in: permissions.map((permission) => permission._id) },
  })
    .select("permissionId isActive")
    .lean();

  const stateMap = new Map(states.map((state) => [String(state.permissionId), state.isActive !== false]));

  const effective = permissions.map((permission) => ({
    ...permission,
    isActive: permission.isActive !== false && (stateMap.has(String(permission._id)) ? stateMap.get(String(permission._id)) : true),
  }));

  return includeInactive ? effective : effective.filter((permission) => permission.isActive);
};

const getSystemPermissionIds = async ({ createdBy = null, includeInactive = false } = {}) => {
  const permissions = await getSystemPermissions({
    createdBy,
    includeInactive,
  });

  return permissions.map((permission) => permission._id);
};

const getBusinessPermissions = async (businessId, { includeInactive = false } = {}) => {
  validateObjectId(businessId, "business ID");

  const filter = {
    businessId,
    type: "CUSTOM",
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  return Permission.find(filter)
    .sort({
      module: 1,
      action: 1,
      name: 1,
    })
    .lean();
};

const getAllAvailablePermissions = async (businessId, { includeInactive = false, createdBy = null } = {}) => {
  validateObjectId(businessId, "business ID");

  const [systemPermissions, businessPermissions] = await Promise.all([
    getSystemPermissions({
      includeInactive,
      createdBy,
      businessId,
    }),
    getBusinessPermissions(businessId, {
      includeInactive,
    }),
  ]);

  return {
    systemPermissions,
    businessPermissions,
  };
};

const updatePermission = async (permissionId, updates, updatedBy, businessId = null) => {
  validateObjectId(permissionId, "permission ID");
  validateObjectId(updatedBy, "updater ID");

  if (businessId !== null) {
    validateObjectId(businessId, "business ID");
  }

  const permission = await Permission.findById(permissionId);

  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    throw new ApiError(400, "Permission updates must be an object.");
  }

  if (permission.type === "SYSTEM") {
    const updateKeys = Object.keys(updates);

    const invalidKeys = updateKeys.filter((key) => key !== "isActive");

    if (invalidKeys.length > 0) {
      throw new ApiError(403, "System permissions cannot be edited.");
    }

    if (!Object.prototype.hasOwnProperty.call(updates, "isActive")) {
      throw new ApiError(400, "Only the active status of a system permission can be changed.");
    }

    if (!businessId) {
      throw new ApiError(400, "Business ID is required to change a system permission status.");
    }

    if (typeof updates.isActive !== "boolean") {
      throw new ApiError(400, "System permission active status must be boolean.");
    }

    if (permission.isActive !== true) {
      permission.isActive = true;
      permission.updatedBy = updatedBy;

      await permission.save();
    }

    const state = await BusinessPermissionState.findOneAndUpdate(
      {
        businessId,
        permissionId: permission._id,
      },
      {
        $set: {
          isActive: updates.isActive,
          updatedBy,
        },
        $setOnInsert: {
          createdBy: updatedBy,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return {
      ...permission.toObject(),
      isActive: state.isActive !== false,
      businessId: null,

      statusScope: "BUSINESS",
    };
  }

  if (permission.type !== "CUSTOM") {
    throw new ApiError(403, "This permission cannot be modified.");
  }
  if (!businessId || !permission.businessId || String(permission.businessId) !== String(businessId)) {
    throw new ApiError(403, "You do not have access to this permission.");
  }

  if (Object.prototype.hasOwnProperty.call(updates, "name")) {
    const name = String(updates.name || "").trim();

    if (!name) {
      throw new ApiError(400, "Permission name cannot be empty.");
    }

    permission.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    permission.description = updates.description ? String(updates.description).trim() : null;
  }

  let nextModule = permission.module;

  if (Object.prototype.hasOwnProperty.call(updates, "module")) {
    nextModule = String(updates.module || "")
      .trim()
      .toLowerCase();

    if (!nextModule || !/^[a-zA-Z0-9_-]+$/.test(nextModule)) {
      throw new ApiError(400, "Permission module is invalid.");
    }
  }

  let nextAction = permission.action;

  if (Object.prototype.hasOwnProperty.call(updates, "action")) {
    nextAction = String(updates.action || "")
      .trim()
      .toLowerCase();

    if (!nextAction || !/^[a-zA-Z0-9_-]+$/.test(nextAction)) {
      throw new ApiError(400, "Permission action is invalid.");
    }
  }

  if (nextModule !== permission.module || nextAction !== permission.action) {
    const nextSlug = `${nextModule}.${nextAction}`;

    const reservedSystemPermission = await Permission.findOne({
      businessId: null,
      type: "SYSTEM",
      slug: nextSlug,
    })
      .select("_id")
      .lean();

    if (reservedSystemPermission) {
      throw new ApiError(409, "This permission slug is reserved by the CRM system.");
    }

    const duplicate = await Permission.findOne({
      businessId: permission.businessId,
      slug: nextSlug,
      _id: {
        $ne: permission._id,
      },
    }).select("_id");

    if (duplicate) {
      throw new ApiError(409, "A permission with this module and action already exists.");
    }

    permission.module = nextModule;
    permission.action = nextAction;
    permission.slug = nextSlug;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "isActive")) {
    if (typeof updates.isActive !== "boolean") {
      throw new ApiError(400, "Permission active status must be boolean.");
    }

    permission.isActive = updates.isActive;
  }

  permission.updatedBy = updatedBy;

  await permission.save();

  if (permission.isActive === false) {
    const Role = require("../roles/role.model");

    await Role.updateMany(
      {
        businessId,
        permissions: permission._id,
      },
      {
        $pull: {
          permissions: permission._id,
        },
      }
    );
  }

  return permission;
};

const deletePermission = async (permissionId, deletedBy, businessId = null) => {
  validateObjectId(permissionId, "permission ID");
  validateObjectId(deletedBy, "deleter ID");

  if (businessId !== null) validateObjectId(businessId, "business ID");

  const permission = await Permission.findById(permissionId);

  if (!permission) {
    throw new ApiError(404, "Permission not found.");
  }

  if (permission.type === "SYSTEM") {
    throw new ApiError(403, "System permissions cannot be deleted.");
  }

  if (permission.type !== "CUSTOM") {
    throw new ApiError(403, "This permission cannot be deleted.");
  }

  if (businessId === null || !permission.businessId || String(permission.businessId) !== String(businessId)) {
    throw new ApiError(403, "You do not have access to this permission.");
  }

  await Permission.deleteOne({
    _id: permissionId,
    type: "CUSTOM",
    businessId,
  });

  const Role = require("../roles/role.model");

  await Role.updateMany(
    {
      businessId,
      type: "CUSTOM",
      permissions: permissionId,
    },
    {
      $pull: {
        permissions: permissionId,
      },
    }
  );

  return permission;
};

const validatePermissionIds = async (permissionIds = [], businessId = null) => {
  if (!Array.isArray(permissionIds)) {
    throw new ApiError(400, "Permissions must be an array.");
  }

  const uniquePermissionIds = [...new Set(permissionIds.filter((permissionId) => permissionId !== null && permissionId !== undefined && String(permissionId).trim() !== "").map(String))];

  for (const permissionId of uniquePermissionIds) {
    validateObjectId(permissionId, "permission ID");
  }

  if (uniquePermissionIds.length === 0) {
    return [];
  }

  if (businessId) {
    validateObjectId(businessId, "business ID");
  }

  const filter = {
    _id: {
      $in: uniquePermissionIds,
    },

    isActive: true,

    $or: [
      {
        type: "SYSTEM",
        businessId: null,
      },
      ...(businessId
        ? [
            {
              type: "CUSTOM",
              businessId,
            },
          ]
        : []),
    ],
  };

  const permissions = await Permission.find(filter).select("_id type businessId isActive").lean();

  if (permissions.length !== uniquePermissionIds.length) {
    throw new ApiError(400, "One or more permission IDs are invalid, inactive, or not available for this business.");
  }

  if (businessId) {
    const systemPermissionIds = permissions.filter((permission) => permission.type === "SYSTEM").map((permission) => permission._id);

    if (systemPermissionIds.length > 0) {
      const inactiveStates = await BusinessPermissionState.find({
        businessId,

        permissionId: {
          $in: systemPermissionIds,
        },

        isActive: false,
      })
        .select("permissionId")
        .lean();

      const inactiveSystemIds = new Set(inactiveStates.map((state) => String(state.permissionId)));

      for (const permissionId of uniquePermissionIds) {
        if (inactiveSystemIds.has(String(permissionId))) {
          throw new ApiError(400, `Permission ${permissionId} is inactive for this business.`);
        }
      }
    }
  }

  return uniquePermissionIds;
};

const getActivePermissionIdsForBusiness = async (permissionIds = [], businessId) => {
  if (!Array.isArray(permissionIds)) {
    throw new ApiError(400, "Permissions must be an array.");
  }
  validateObjectId(businessId, "business ID");

  const uniqueIds = [...new Set(permissionIds.map(String))];
  if (!uniqueIds.length) return [];

  uniqueIds.forEach((id) => validateObjectId(id, "permission ID"));

  const permissions = await Permission.find({
    _id: { $in: uniqueIds },
    $or: [
      { businessId: null, type: "SYSTEM", isActive: true },
      { businessId, type: "CUSTOM", isActive: true },
    ],
  })
    .select("_id type businessId isActive")
    .lean();

  const systemIds = permissions.filter((permission) => permission.type === "SYSTEM").map((permission) => permission._id);
  const states = systemIds.length
    ? await BusinessPermissionState.find({
        businessId,
        permissionId: { $in: systemIds },
        isActive: false,
      })
        .select("permissionId")
        .lean()
    : [];

  const inactiveSystemIds = new Set(states.map((state) => String(state.permissionId)));

  return permissions.filter((permission) => permission.type !== "SYSTEM" || !inactiveSystemIds.has(String(permission._id))).map((permission) => String(permission._id));
};

const getPermissionIdsBySlugs = async (slugs = [], { createMissing = false, createdBy = null } = {}) => {
  if (!Array.isArray(slugs)) {
    throw new ApiError(400, "Permission slugs must be an array.");
  }

  const normalizedSlugs = [...new Set(slugs.filter(Boolean).map((slug) => String(slug).trim().toLowerCase()))];

  if (normalizedSlugs.length === 0) {
    return [];
  }

  if (createMissing) {
    if (!createdBy) {
      throw new ApiError(400, "createdBy is required when creating missing permissions.");
    }

    validateObjectId(createdBy, "creator ID");

    await initializeSystemPermissions({
      createdBy,
    });
  }

  const permissions = await Permission.find({
    slug: {
      $in: normalizedSlugs,
    },
    type: "SYSTEM",
    businessId: null,
    isActive: true,
  })
    .select("_id slug")
    .lean();

  const permissionMap = new Map(permissions.map((permission) => [permission.slug, permission._id]));

  const missing = normalizedSlugs.filter((slug) => !permissionMap.has(slug));

  if (missing.length > 0) {
    throw new ApiError(500, `System permissions are missing: ${missing.join(", ")}`);
  }

  return normalizedSlugs.map((slug) => permissionMap.get(slug));
};

const repairSystemPermissions = async ({ createdBy }) => {
  const permissions = await initializeSystemPermissions({
    createdBy,
  });

  return {
    count: permissions.length,
    permissions,
  };
};

module.exports = {
  SYSTEM_PERMISSIONS,

  validateObjectId,
  normalizeSlug,

  getPermissionById,
  getPermissionBySlug,

  createPermission,

  initializeSystemPermissions,
  repairSystemPermissions,

  getSystemPermissions,
  getSystemPermissionIds,

  getBusinessPermissions,
  getAllAvailablePermissions,

  getPermissionIdsBySlugs,

  updatePermission,
  deletePermission,

  validatePermissionIds,
  getActivePermissionIdsForBusiness,
};
