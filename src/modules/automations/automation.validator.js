const { body, param, query } = require("express-validator");
const entities = ["lead", "contact", "company", "deal", "task", "activity", "note"];
const events = ["created", "updated", "deleted", "status_changed", "assigned", "stage_changed"];
const operators = ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal", "is_empty", "is_not_empty", "in", "not_in"];
const actions = ["update_record", "assign_user", "assign_team", "add_tag", "remove_tag", "create_task", "create_note", "send_notification", "send_email", "send_webhook"];
const ids = [param("businessId").isMongoId().withMessage("businessId must be a valid ID")];
const autoIds = [...ids, param("automationId").isMongoId().withMessage("automationId must be a valid ID")];
const trigger = [
  body("trigger").isObject(),
  body("trigger.mode").optional().isIn(["EVENT", "SCHEDULE", "MANUAL"]),
  body("trigger.entity").isIn(entities),
  body("trigger.event").isIn(events),
  body("trigger.field").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("trigger.schedule").optional().isObject(),
  body("trigger.schedule.runAt").optional({ nullable: true }).isISO8601(),
  body("trigger.schedule.intervalSeconds").optional({ nullable: true }).isInt({ min: 60 }),
  body("trigger.schedule.endAt").optional({ nullable: true }).isISO8601(),
  body("trigger.schedule.timezone").optional().isString().isLength({ max: 80 }),
];
const actionValidation = [body("actions").isArray({ min: 1 }), body("actions.*.type").isIn(actions), body("actions.*.config").optional().isObject(), body("actions.*.delaySeconds").optional().isInt({ min: 0, max: 2592000 })];
const conditionValidation = [body("conditions").optional().isArray(), body("conditions.*.field").optional().isString().isLength({ max: 150 }), body("conditions.*.operator").optional().isIn(operators), body("conditionLogic").optional().isIn(["AND", "OR"])];
const executionValidation = [body("execution").optional().isObject(), body("execution.maxRunsPerRecord").optional().isInt({ min: 1 }), body("execution.cooldownSeconds").optional().isInt({ min: 0 }), body("execution.stopOnError").optional().isBoolean()];
const metadataValidator = [...ids];
const createAutomationValidator = [
  ...ids,
  body("name").trim().notEmpty().isLength({ max: 150 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 1000 }),
  ...trigger,
  ...conditionValidation,
  ...actionValidation,
  body("status").optional().isIn(["ACTIVE", "INACTIVE"]),
  ...executionValidation,
];
const listAutomationValidator = [
  ...ids,
  query("status").optional().isIn(["ACTIVE", "INACTIVE"]),
  query("entity").optional().isIn(entities),
  query("search").optional().isString().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sortBy").optional().isIn(["createdAt", "name"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
const automationIdValidator = [...autoIds];
const updateAutomationValidator = [
  ...autoIds,
  body("name").optional().trim().isLength({ min: 1, max: 150 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 1000 }),
  body("trigger").optional().isObject(),
  body("trigger.mode").optional().isIn(["EVENT", "SCHEDULE", "MANUAL"]),
  body("trigger.entity").optional().isIn(entities),
  body("trigger.event").optional().isIn(events),
  body("trigger.field").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("conditions").optional().isArray(),
  body("conditionLogic").optional().isIn(["AND", "OR"]),
  body("actions").optional().isArray({ min: 1 }),
  body("actions.*.type").optional().isIn(actions),
  body("actions.*.config").optional().isObject(),
  body("actions.*.delaySeconds").optional().isInt({ min: 0, max: 2592000 }),
  body("status").optional().isIn(["ACTIVE", "INACTIVE"]),
  ...executionValidation,
];
const statusValidator = [...autoIds, body("status").isIn(["ACTIVE", "INACTIVE"])];
const cloneValidator = [...autoIds, body("name").optional().trim().isLength({ min: 1, max: 150 })];
const executeValidator = [...autoIds, body("entityId").optional().isMongoId(), body("record").optional().isObject()];
const executionListValidator = [...autoIds, query("status").optional().isIn(["RUNNING", "SUCCESS", "FAILED", "SKIPPED"]), query("page").optional().isInt({ min: 1 }).toInt(), query("limit").optional().isInt({ min: 1, max: 100 }).toInt()];
const executionIdValidator = [...ids, param("executionId").isMongoId()];
module.exports = { createAutomationValidator, listAutomationValidator, automationIdValidator, updateAutomationValidator, statusValidator, executeValidator, executionListValidator, executionIdValidator, cloneValidator, metadataValidator };
