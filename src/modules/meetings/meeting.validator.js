const { body, param, query } = require("express-validator");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const MEETING_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

const ATTENDEE_RESPONSES = ["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"];

const REMINDER_CHANNELS = ["IN_APP", "EMAIL", "WHATSAPP", "SMS"];

const RELATED_TYPES = ["LEAD", "CONTACT", "COMPANY", "DEAL"];

const businessIdValidator = [param("businessId").matches(objectIdRegex).withMessage("Invalid business ID.")];

const meetingIdValidator = [param("meetingId").matches(objectIdRegex).withMessage("Invalid meeting ID.")];

const listMeetingValidator = [
  ...businessIdValidator,

  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),

  query("from").optional().isISO8601().withMessage("Invalid from date."),

  query("to").optional().isISO8601().withMessage("Invalid to date."),

  query("status").optional().isIn(MEETING_STATUSES).withMessage("Invalid meeting status."),

  query("organizerId").optional().matches(objectIdRegex).withMessage("Invalid organizer ID."),

  query("relatedType").optional().isIn(RELATED_TYPES).withMessage("Invalid related entity type."),

  query("relatedId").optional().matches(objectIdRegex).withMessage("Invalid related entity ID."),
];

const attendeeValidator = body("attendees").optional().isArray({ max: 100 }).withMessage("Attendees must be an array with maximum 100 attendees.");

const attendeeUserIdValidator = body("attendees.*.userId").optional({ nullable: true }).matches(objectIdRegex).withMessage("Invalid attendee user ID.");

const attendeeEmailValidator = body("attendees.*.email").optional({ nullable: true }).isEmail().withMessage("Invalid attendee email.");

const attendeeNameValidator = body("attendees.*.name").optional({ nullable: true }).trim().isLength({ max: 200 }).withMessage("Attendee name cannot exceed 200 characters.");

const attendeeResponseValidator = body("attendees.*.response").optional().isIn(ATTENDEE_RESPONSES).withMessage("Invalid attendee response.");

const reminderValidator = [
  body("reminders").optional().isArray({ max: 20 }).withMessage("Reminders must be an array with maximum 20 reminders."),

  body("reminders.*.minutesBefore").isInt({ min: 0, max: 10080 }).withMessage("Reminder minutes must be between 0 and 10080."),

  body("reminders.*.channel").optional().isIn(REMINDER_CHANNELS).withMessage("Invalid reminder channel."),
];

const relatedToValidator = [
  body("relatedTo").optional({ nullable: true }).isObject().withMessage("relatedTo must be an object."),

  body("relatedTo.type").optional().isIn(RELATED_TYPES).withMessage("Invalid related entity type."),

  body("relatedTo.id").optional().matches(objectIdRegex).withMessage("Invalid related entity ID."),
];

const createMeetingValidator = [
  ...businessIdValidator,

  body("title").trim().notEmpty().withMessage("Meeting title is required.").isLength({ max: 200 }).withMessage("Meeting title cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),

  body("startAt").notEmpty().withMessage("Meeting start time is required.").isISO8601().withMessage("Invalid meeting start time."),

  body("endAt").notEmpty().withMessage("Meeting end time is required.").isISO8601().withMessage("Invalid meeting end time."),

  body("timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters."),

  body("location").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Location cannot exceed 500 characters."),

  body("meetingUrl").optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage("Meeting URL cannot exceed 2000 characters."),

  attendeeValidator,
  attendeeUserIdValidator,
  attendeeEmailValidator,
  attendeeNameValidator,
  attendeeResponseValidator,

  ...relatedToValidator,

  ...reminderValidator,

  body("notes").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Notes cannot exceed 5000 characters."),

  body("metadata").optional().isObject().withMessage("Metadata must be an object."),
];

const updateMeetingValidator = [
  ...businessIdValidator,
  ...meetingIdValidator,

  body("title").optional().trim().notEmpty().withMessage("Meeting title cannot be empty.").isLength({ max: 200 }).withMessage("Meeting title cannot exceed 200 characters."),

  body("description").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Description cannot exceed 5000 characters."),

  body("startAt").optional().isISO8601().withMessage("Invalid meeting start time."),

  body("endAt").optional().isISO8601().withMessage("Invalid meeting end time."),

  body("timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters."),

  body("location").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("Location cannot exceed 500 characters."),

  body("meetingUrl").optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage("Meeting URL cannot exceed 2000 characters."),

  body("status").optional().isIn(MEETING_STATUSES).withMessage("Invalid meeting status."),

  attendeeValidator,
  attendeeUserIdValidator,
  attendeeEmailValidator,
  attendeeNameValidator,
  attendeeResponseValidator,

  ...relatedToValidator,

  ...reminderValidator,

  body("outcome").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Outcome cannot exceed 5000 characters."),

  body("cancellationReason").optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage("Cancellation reason cannot exceed 2000 characters."),

  body("notes").optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage("Notes cannot exceed 5000 characters."),

  body("metadata").optional().isObject().withMessage("Metadata must be an object."),
];

module.exports = {
  businessIdValidator,
  meetingIdValidator,
  listMeetingValidator,
  createMeetingValidator,
  updateMeetingValidator,
};
