# BR30 CRM Backend

Production-oriented, multi-tenant CRM API for BR30 CRM.

## 1. What BR30 CRM does

BR30 CRM is a business workspace CRM. A business creates a workspace, adds members and teams, controls roles/permissions, captures leads from manual and public sources, converts leads into contacts/companies/deals, manages sales pipelines, tasks, activities and meetings, communicates through email/WhatsApp/SMS, automates business actions, receives webhooks/social leads, and reports on business activity.

## 2. Architecture

```text
Client / Website / Public Form / Social / Webhook
                    |
                    v
              Express API
                    |
       Helmet + CORS + Rate Limit
                    |
        Request ID + Validation
                    |
          JWT Authentication
                    |
     Business Membership / Role
                    |
              Permission
                    |
              Controller
                    |
                Service
                    |
               MongoDB
                    |
     Event Bus -> Automation Engine
                    |
        Background Job Worker
                    |
 Email / WhatsApp / SMS / Webhooks
```

Tenant boundary: `businessId`.
API prefix: `/api/v1`.

## 3. Complete source structure

```text
BR30 CRM-B/
├── src/
│   ├── automation/                 # Event-driven automation execution
│   ├── config/                     # DB, env, email, cloudinary, logging
│   ├── constants/                  # Stable role/permission/status constants
│   ├── controllers/                # Shared controllers, where applicable
│   ├── events/                     # Event bus
│   ├── integrations/               # Provider integration configuration
│   ├── jobs/                       # Persistent background jobs + worker
│   ├── middleware/                 # Auth, authorization, validation, security
│   ├── modules/                    # Domain modules
│   │   ├── activities/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── announcements/
│   │   ├── api-keys/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── automations/
│   │   ├── business-members/
│   │   ├── businesses/
│   │   ├── companies/
│   │   ├── communications/         # Email / WhatsApp / SMS execution
│   │   ├── contacts/
│   │   ├── custom-fields/
│   │   ├── deals/
│   │   ├── duplicates/
│   │   ├── files/
│   │   ├── import-export/
│   │   ├── integrations/
│   │   ├── invitations/
│   │   ├── leads/
│   │   ├── meetings/               # Calendar / meetings / reminders
│   │   ├── notes/
│   │   ├── notifications/
│   │   ├── permissions/
│   │   ├── pipelines/
│   │   ├── public-forms/            # Public lead capture + QR URL
│   │   ├── reports/
│   │   ├── roles/
│   │   ├── search/
│   │   ├── sessions/
│   │   ├── settings/
│   │   ├── social-leads/             # Facebook/Instagram/other webhook-ready ingestion
│   │   ├── tags/
│   │   ├── tasks/
│   │   ├── teams/
│   │   ├── users/
│   │   ├── webhooks/
│   │   └── whats-new/
│   ├── routes/                     # `/api/v1` route registry
│   ├── services/                   # Shared provider services
│   ├── templates/                  # Email/templates where applicable
│   ├── utils/                      # JWT, IDs, cookies, API helpers
│   └── validators/                 # Shared validators
├── docs/
│   └── ULTRA_BACKEND_UPGRADE.md
├── doc&flow-api.txt                # Full business/API/flow reference
├── tests/
├── .env.example
├── package.json
└── README.md
```

## 4. Modules

### Identity and access
- Authentication: registration, verification, login, refresh, logout, password reset, profile.
- Sessions and refresh-session management.
- Businesses/workspaces.
- Business members and invitations.
- Teams.
- Roles and permissions.
- Master-admin platform access.
- API keys.

### CRM core
- Leads.
- Lead assignment and conversion.
- Contacts.
- Companies.
- Pipelines and stages.
- Deals.
- Activities.
- Tasks and follow-ups.
- Notes.
- Tags.
- Custom fields.
- Duplicate detection.

### Capture and acquisition
- Manual leads.
- Public lead forms.
- Public form URLs.
- QR URL generation endpoint.
- Campaign/source metadata.
- Social lead webhook ingestion.
- Generic API/webhook-ready architecture.
- Import/export.

### Communication
- Email through the existing Brevo service.
- WhatsApp Cloud API adapter through a business integration record.
- Twilio SMS adapter through a business integration record.
- Communication history model.
- Outbound/inbound status model.

### Meetings and calendar
- Meeting records.
- Start/end time and timezone.
- Attendees and responses.
- Meeting URL/location.
- Related CRM record.
- Reminders.
- Meeting lifecycle statuses.

### Automation and operations
- Event bus.
- Automation triggers.
- Conditions.
- Update record.
- Assign user/team.
- Add/remove tags.
- Create task/note.
- Send notification/email.
- Send webhook.
- Cooldown and execution status.
- Persistent background jobs and retry handling.

### Platform operations
- Notifications.
- Announcements.
- What's New.
- Analytics.
- Reports.
- Audit logs.
- Search.
- File management.
- Settings.
- Health endpoint.
- Rate limiting.
- Helmet/CORS/security headers.
- Centralized errors and request IDs.

## 5. Lead lifecycle

```text
Manual / Public Form / QR / Social / Import / API
                    |
                    v
                  LEAD
                    |
             Assign user/team
                    |
             Contact / qualify
                    |
          Convert to Contact
          + optional Company
          + optional Deal
                    |
                 Pipeline
                    |
              Deal / Stage
                    |
              WON / LOST
```

## 6. Public lead capture

1. Business member creates a public form.
2. Form receives a stable business + slug URL.
3. Frontend can render the form without authentication.
4. Visitor submits data to the public submit endpoint.
5. Backend validates required fields.
6. Backend creates a lead in the correct business tenant.
7. Lead source/campaign/public-form metadata is stored.
8. Event bus publishes `lead.created`.
9. Active automations can react immediately.
10. Public form can return a success message/redirect.
11. QR endpoint returns the public URL and QR image URL.

## 7. Social lead capture

`POST /api/v1/social-leads/:businessId/:source`

The endpoint accepts normalized provider payloads and creates a business-scoped lead. It supports an HMAC signature using `x-br30-signature` when a webhook secret is configured. Provider-specific Meta/LinkedIn configuration remains in the business integration layer; the CRM lead-ingestion contract stays provider-neutral.

## 8. Communication providers

### Email
Uses the existing Brevo service and environment configuration:
- `BREVO_EMAIL`
- `BREVO_SMTP_KEY`

### WhatsApp
Configure a business integration with:
- type: `WHATSAPP`
- provider: Meta/WhatsApp Cloud API
- credentials: `accessToken`, `phoneNumberId`

### SMS
Configure a business integration with:
- type: `SMS`
- provider: Twilio
- credentials: `accountSid`, `authToken`, `from`

Provider secrets must never be committed to source control.

## 9. Authentication and authorization

Normal business request flow:

```text
JWT
 -> authenticated user
 -> businessId
 -> active BusinessMember
 -> active Role
 -> required Permission
 -> controller
 -> service
 -> business-scoped query
```

Master Admin is separately identified by `MASTER_ADMIN_USER_ID` and is not treated as a normal business member.

## 10. Installation

```bash
npm install
```

Copy `.env.example` to `.env` and provide real deployment values.

Start development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## 11. Environment

Required core values:

```text
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
BREVO_EMAIL
BREVO_SMTP_KEY
CLOUD_NAME
CLOUD_API_KEY
CLOUD_API_SECRET
MASTER_ADMIN_USER_ID
```

Optional/public values:

```text
PUBLIC_FORM_BASE_URL
SOCIAL_WEBHOOK_SECRET
FRONTEND_URLS
COOKIE_SECURE
COOKIE_SAME_SITE
LOG_LEVEL
```

Business-specific WhatsApp/SMS credentials belong in the Integrations module and database configuration, not in a source-controlled `.env` file.

## 12. API groups

All APIs are under `/api/v1`.

```text
/auth
/businesses
/business-members
/roles
/permissions
/users
/teams
/invitations
/leads
/contacts
/companies
/pipelines
/deals
/activities
/tasks
/notes
/tags
/custom-fields
/api-keys
/integrations
/webhooks
/automations
/notifications
/announcements
/files
/analytics
/audit
/settings
/whatsnew
/admin
/search
/import-export
/duplicates
/reports
/sessions
/public-forms
/meetings
/communications
/social-leads
```

## 13. Health check

`GET /api/v1/health`

Returns API status, environment, uptime, request ID and MongoDB state.

## 14. Production checklist

- Use strong JWT secrets.
- Configure MongoDB Atlas network access and least-privilege DB credentials.
- Configure production CORS origins only.
- Enable secure cookies in production.
- Configure Brevo.
- Configure Cloudinary.
- Configure WhatsApp/Twilio integrations per business.
- Configure public form base URL.
- Configure webhook secrets.
- Run API smoke tests after deployment.
- Monitor worker failures and audit logs.
- Never commit `.env` or provider secrets.

## 15. Project documentation

See `doc&flow-api.txt` for the complete A-to-Z module, flow, API, integration, permission and deployment reference.

## 16. BR30 CRM ownership/footer wording

Frontend and product branding should use:

`Built with ❤️ by BR30 Group`

---

BR30 CRM Backend v2.0.0
