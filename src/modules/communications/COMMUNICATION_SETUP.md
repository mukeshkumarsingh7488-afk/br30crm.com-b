# BR30 CRM Communications Backend

## Email

Connect a business mailbox with Google Gmail or Microsoft Outlook from the CRM.

OAuth start endpoints:
- GET `/api/v1/communications/business/:businessId/email/oauth/google`
- GET `/api/v1/communications/business/:businessId/email/oauth/outlook`

OAuth callbacks:
- `/api/v1/communications/email/oauth/google/callback`
- `/api/v1/communications/email/oauth/outlook/callback`

Required environment variables:
- Google: `GOOGLE_EMAIL_CLIENT_ID`, `GOOGLE_EMAIL_CLIENT_SECRET`, `GOOGLE_EMAIL_REDIRECT_URI`
- Microsoft: `MICROSOFT_EMAIL_CLIENT_ID`, `MICROSOFT_EMAIL_CLIENT_SECRET`, `MICROSOFT_EMAIL_REDIRECT_URI`

The existing calendar client ID/secret are accepted as fallback for Google/Microsoft, but dedicated email OAuth credentials are recommended.

After connection, outbound CRM email uses the connected mailbox, not the global Brevo authentication sender. Gmail/Outlook inbox sync runs from the background worker every 60 seconds and stores inbound replies in Communication History.

## WhatsApp

Create an active `WHATSAPP` Integration for the business with:
- provider: `meta-whatsapp`
- credentials: `accessToken`, `phoneNumberId`
- optional config: `senderNumber`, `webhookSecret`, `verifyToken`

Webhook:
- GET/POST `/api/v1/communications/webhooks/whatsapp/:integrationId`

## SMS

Create an active `SMS` Integration with:
- provider: `twilio`
- credentials: `accountSid`, `authToken`, `from`
- optional config: `webhookSecret`

Inbound/status webhook:
- POST `/api/v1/communications/webhooks/sms/:integrationId`

## Unified history

`Communication` stores EMAIL, WHATSAPP and SMS with direction, sender, recipient, provider, provider message ID, status, related CRM entity and metadata.

## Security

OAuth credentials saved by the communication OAuth flow are encrypted before being stored. Existing integration credentials created manually remain compatible.
