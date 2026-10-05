const express = require("express");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const c = require("./report.controller");
const v = require("./report.validator");

const router = express.Router();

router.use(auth);

/* ============================================================
 * CREATE REPORT
 * ============================================================ */

router.post("/business/:businessId", v.create, validate, requireBusinessMembership, requirePermission("reports.create"), c.create);

/* ============================================================
 * LIST REPORTS
 * ============================================================ */

router.get("/business/:businessId", v.list, validate, requireBusinessMembership, requirePermission("reports.view"), c.list);

/* ============================================================
 * SALES REPORT
 * IMPORTANT:
 * MUST COME BEFORE /:reportId
 * ============================================================ */

router.get("/business/:businessId/sales", v.sales, validate, requireBusinessMembership, requirePermission("sales-report.view"), c.sales);

/* ============================================================
 * LEADS REPORT
 * IMPORTANT:
 * MUST COME BEFORE /:reportId
 * ============================================================ */

router.get("/business/:businessId/leads", v.leads, validate, requireBusinessMembership, requirePermission("leads-report.view"), c.leads);

/* ============================================================
 * DEALS REPORT
 * IMPORTANT:
 * MUST COME BEFORE /:reportId
 * ============================================================ */

router.get("/business/:businessId/deals", v.deals, validate, requireBusinessMembership, requirePermission("deals-report.view"), c.deals);

/* ============================================================
 * ACTIVITIES REPORT
 * IMPORTANT:
 * MUST COME BEFORE /:reportId
 * ============================================================ */

router.get("/business/:businessId/activities", v.activities, validate, requireBusinessMembership, requirePermission("activities-report.view"), c.activities);
/* ============================================================
 * RUN SAVED REPORT BY REPORT ID
 *
 * IMPORTANT:
 * This MUST stay AFTER sales / leads / deals.
 * ============================================================ */

router.get("/business/:businessId/:reportId", v.reportId, validate, requireBusinessMembership, requirePermission("reports.view"), c.run);

/* ============================================================
 * RUN SAVED REPORT
 * ============================================================ */

router.post("/business/:businessId/:reportId/run", v.reportId, validate, requireBusinessMembership, requirePermission("reports.view"), c.run);

/* ============================================================
 * UPDATE REPORT
 * ============================================================ */

router.patch("/business/:businessId/:reportId", v.update, validate, requireBusinessMembership, requirePermission("reports.update"), c.update);

/* ============================================================
 * DELETE REPORT
 * ============================================================ */

router.delete("/business/:businessId/:reportId", v.reportId, validate, requireBusinessMembership, requireManagementRole, requirePermission("reports.delete"), c.remove);

module.exports = router;
