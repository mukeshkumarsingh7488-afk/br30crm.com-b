const { body, param, query } = require("express-validator");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const EVENT_TYPES = ["EVENT", "APPOINTMENT", "BLOCKED_TIME", "HOLIDAY", "REMINDER", "EXTERNAL", "OTHER"];
const STATUSES = ["SCHEDULED", "CONFIRMED", "TENTATIVE", "CANCELLED", "COMPLETED"];
const VISIBILITY = ["PRIVATE", "BUSINESS"];
const SOURCES = ["INTERNAL", "GOOGLE", "OUTLOOK"];
const RELATED_TYPES = ["MEETING", "ACTIVITY", "LEAD", "CONTACT", "COMPANY", "DEAL", "OTHER"];
const REMINDER_CHANNELS = ["IN_APP", "EMAIL", "WHATSAPP", "SMS"];
const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

const businessIdValidator = [param("businessId").matches(objectIdRegex).withMessage("Invalid business ID.")];
const calendarIdValidator = [param("calendarId").matches(objectIdRegex).withMessage("Invalid calendar event ID.")];
const accountIdValidator = [param("accountId").matches(objectIdRegex).withMessage("Invalid calendar account ID.")];

const attendeeFields = [
  body("attendees").optional().isArray({ max: 200 }).withMessage("Attendees must be an array with maximum 200 attendees."),
  body("attendees.*.userId").optional({ nullable: true }).matches(objectIdRegex).withMessage("Invalid attendee user ID."),
  body("attendees.*.email").optional({ nullable: true }).isEmail().withMessage("Invalid attendee email."),
  body("attendees.*.name").optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage("Attendee name cannot exceed 200 characters."),
  body("attendees.*.response").optional().isIn(["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"]).withMessage("Invalid attendee response."),
];

const reminderFields = [
  body("reminders").optional().isArray({ max: 20 }).withMessage("Reminders must be an array with maximum 20 reminders."),
  body("reminders.*.minutesBefore").optional().isInt({ min: 0, max: 10080 }).withMessage("Reminder minutes must be between 0 and 10080."),
  body("reminders.*.channel").optional().isIn(REMINDER_CHANNELS).withMessage("Invalid reminder channel."),
];

const recurrenceFields = [
  body("recurrence").optional({ nullable: true }).isObject().withMessage("Recurrence must be an object."),
  body("recurrence.enabled").optional().isBoolean().withMessage("Recurrence enabled must be boolean."),
  body("recurrence.frequency").optional({ nullable: true }).isIn(RECURRENCE_FREQUENCIES).withMessage("Invalid recurrence frequency."),
  body("recurrence.interval").optional().isInt({ min: 1, max: 365 }).withMessage("Recurrence interval must be between 1 and 365."),
  body("recurrence.daysOfWeek").optional().isArray({ max: 7 }).withMessage("Recurrence daysOfWeek must be an array."),
  body("recurrence.daysOfWeek.*").optional().isInt({ min: 0, max: 6 }).withMessage("Invalid recurrence day."),
  body("recurrence.endAt").optional({ nullable: true }).isISO8601().withMessage("Invalid recurrence end date."),
  body("recurrence.count").optional({ nullable: true }).isInt({ min: 1, max: 1000 }).withMessage("Recurrence count must be between 1 and 1000."),
];

const relatedFields = [
  body("relatedTo").optional({ nullable: true }).isObject().withMessage("relatedTo must be an object."),
  body("relatedTo.type").optional().isIn(RELATED_TYPES).withMessage("Invalid related entity type."),
  body("relatedTo.id").optional({ nullable: true }).matches(objectIdRegex).withMessage("Invalid related entity ID."),
];

const listCalendarValidator = [
  ...businessIdValidator,
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
  query("limit").optional().isInt({ min: 1, max: 200 }).withMessage("Limit must be between 1 and 200."),
  query("from").optional().isISO8601().withMessage("Invalid from date."),
  query("to").optional().isISO8601().withMessage("Invalid to date."),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),
  query("type").optional().isIn(EVENT_TYPES).withMessage("Invalid calendar event type."),
  query("status").optional().isIn(STATUSES).withMessage("Invalid calendar event status."),
  query("source").optional().isIn(SOURCES).withMessage("Invalid calendar source."),
  query("organizerId").optional().matches(objectIdRegex).withMessage("Invalid organizer ID."),
  query("includeMeetings").optional().isBoolean().withMessage("includeMeetings must be boolean."),
  query("includeActivities").optional().isBoolean().withMessage("includeActivities must be boolean."),
];

const createCalendarValidator = [
  ...businessIdValidator,
  body("title").trim().notEmpty().withMessage("Calendar event title is required.").isLength({ max: 200 }).withMessage("Calendar event title cannot exceed 200 characters."),
  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),
  body("type").optional().isIn(EVENT_TYPES).withMessage("Invalid calendar event type."),
  body("status").optional().isIn(STATUSES).withMessage("Invalid calendar event status."),
  body("startAt").notEmpty().withMessage("Start time is required.").isISO8601().withMessage("Invalid start time."),
  body("endAt").notEmpty().withMessage("End time is required.").isISO8601().withMessage("Invalid end time."),
  body("allDay").optional().isBoolean().withMessage("allDay must be boolean."),
  body("timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters."),
  body("location").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Location cannot exceed 500 characters."),
  body("meetingUrl").optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage("Meeting URL cannot exceed 2000 characters."),
  body("visibility").optional().isIn(VISIBILITY).withMessage("Invalid visibility."),
  body("color").optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage("Color cannot exceed 30 characters."),
  ...attendeeFields,
  ...relatedFields,
  ...reminderFields,
  ...recurrenceFields,
  body("metadata").optional().isObject().withMessage("Metadata must be an object."),
];

const updateCalendarValidator = [
  ...businessIdValidator,
  ...calendarIdValidator,
  body("title").optional().trim().notEmpty().withMessage("Calendar event title cannot be empty.").isLength({ max: 200 }).withMessage("Calendar event title cannot exceed 200 characters."),
  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),
  body("type").optional().isIn(EVENT_TYPES).withMessage("Invalid calendar event type."),
  body("status").optional().isIn(STATUSES).withMessage("Invalid calendar event status."),
  body("startAt").optional().isISO8601().withMessage("Invalid start time."),
  body("endAt").optional().isISO8601().withMessage("Invalid end time."),
  body("allDay").optional().isBoolean().withMessage("allDay must be boolean."),
  body("timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters."),
  body("location").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Location cannot exceed 500 characters."),
  body("meetingUrl").optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage("Meeting URL cannot exceed 2000 characters."),
  body("visibility").optional().isIn(VISIBILITY).withMessage("Invalid visibility."),
  body("color").optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage("Color cannot exceed 30 characters."),
  ...attendeeFields,
  ...relatedFields,
  ...reminderFields,
  ...recurrenceFields,
  body("metadata").optional().isObject().withMessage("Metadata must be an object."),
];

module.exports = { businessIdValidator, calendarIdValidator, accountIdValidator, listCalendarValidator, createCalendarValidator, updateCalendarValidator, EVENT_TYPES, STATUSES, VISIBILITY, SOURCES, RELATED_TYPES, REMINDER_CHANNELS, RECURRENCE_FREQUENCIES };
