const { param, body, query } = require("express-validator");

const sources = ["leads", "contacts", "companies", "deals", "tasks"];

/*
 * ============================================================
 * COMMON BUSINESS ID
 * ============================================================
 */

const base = [param("businessId").isMongoId().withMessage("Invalid business ID.")];

/*
 * ============================================================
 * CREATE REPORT
 * ============================================================
 */

const create = [...base, body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Report name must be between 2 and 120 characters."), body("source").isIn(sources).withMessage("Invalid report source.")];

/*
 * ============================================================
 * LIST REPORTS
 * ============================================================
 */

const list = [...base, query("page").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Invalid page."), query("limit").optional({ values: "falsy" }).isInt({ min: 1, max: 100 }).withMessage("Invalid limit.")];

/*
 * ============================================================
 * COMMON REPORT FILTERS
 * ============================================================
 */

const dateFromValidator = query("dateFrom").optional({ values: "falsy" }).isISO8601().withMessage("Invalid dateFrom.");

const dateToValidator = query("dateTo").optional({ values: "falsy" }).isISO8601().withMessage("Invalid dateTo.");

const assignedToValidator = query("assignedTo").optional({ values: "falsy" }).isMongoId().withMessage("Invalid assigned user ID.");

const sourceValidator = query("source").optional({ values: "falsy" }).isString().trim().isLength({ max: 100 }).withMessage("Invalid source.");

/*
 * ============================================================
 * SALES REPORT
 * ============================================================
 */

const sales = [...base, dateFromValidator, dateToValidator, query("status").optional({ values: "falsy" }).isIn(["OPEN", "WON", "LOST"]).withMessage("Invalid deal status."), sourceValidator, assignedToValidator];

/*
 * ============================================================
 * LEADS REPORT
 * ============================================================
 */

const leads = [...base, dateFromValidator, dateToValidator, query("status").optional({ values: "falsy" }).isIn(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]).withMessage("Invalid lead status."), sourceValidator, assignedToValidator];

/*
 * ============================================================
 * DEALS REPORT
 * ============================================================
 */

const deals = [...base, dateFromValidator, dateToValidator, query("status").optional({ values: "falsy" }).isIn(["OPEN", "WON", "LOST"]).withMessage("Invalid deal status."), sourceValidator, assignedToValidator];

/*
 * ============================================================
 * ACTIVITIES REPORT
 * ============================================================
 */

const activities = [
  ...base,

  dateFromValidator,

  dateToValidator,

  query("type").optional({ values: "falsy" }).isString().trim().isLength({ max: 100 }).withMessage("Invalid activity type."),

  query("status").optional({ values: "falsy" }).isString().trim().isLength({ max: 100 }).withMessage("Invalid activity status."),

  assignedToValidator,
];

/*
 * ============================================================
 * REPORT ID
 * ============================================================
 */

const reportId = [...base, param("reportId").isMongoId().withMessage("Invalid report ID.")];

/*
 * ============================================================
 * UPDATE REPORT
 * ============================================================
 */

const update = [...reportId, body("source").optional({ values: "falsy" }).isIn(sources).withMessage("Invalid report source."), body("name").optional({ values: "falsy" }).trim().isLength({ min: 2, max: 120 }).withMessage("Report name must be between 2 and 120 characters.")];

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  create,
  list,
  sales,
  leads,
  deals,
  activities,
  reportId,
  update,
};
