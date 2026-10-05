const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const validate = require("../../middleware/validation");

const analyticsController = require("./analytics.controller");

const { businessIdValidator, metricValidator, snapshotIdValidator, listSnapshotValidator, createSnapshotValidator } = require("./analytics.validator");

router.use(auth);

router.get("/business/:businessId/overview", [...businessIdValidator, requireBusinessMembership, requirePermission("analytics.view"), validate], analyticsController.getOverview);

router.get("/business/:businessId/metric/:metric", metricValidator, validate, requireBusinessMembership, requirePermission("analytics.view"), analyticsController.getMetric);

router.get("/business/:businessId/snapshots", listSnapshotValidator, validate, requireBusinessMembership, requirePermission("analytics.view"), analyticsController.getSnapshots);

router.get("/business/:businessId/snapshots/:snapshotId", snapshotIdValidator, validate, requireBusinessMembership, requirePermission("analytics.view"), analyticsController.getSnapshotById);

router.post("/business/:businessId/snapshots", createSnapshotValidator, validate, requireBusinessMembership, requirePermission("analytics.create"), analyticsController.createSnapshot);

router.delete("/business/:businessId/snapshots/:snapshotId", snapshotIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("analytics.delete"), analyticsController.deleteSnapshot);

module.exports = router;
