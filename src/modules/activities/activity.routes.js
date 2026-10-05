const express = require("express");

const activityController = require("./activity.controller");

const { businessIdValidator, activityIdValidator, paginationValidators, createActivityValidator, updateActivityValidator, completeActivityValidator } = require("./activity.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

/*
 * All activity routes require authentication.
 */
router.use(auth);

/*
 * Create a new activity.
 */
router.post("/business/:businessId", createActivityValidator, validate, requireBusinessMembership, requirePermission("activities.create"), activityController.createActivity);

/*
 * Get all activities of a business.
 */
router.get("/business/:businessId", [...businessIdValidator, ...paginationValidators], validate, requireBusinessMembership, requirePermission("activities.view"), activityController.getActivitiesByBusiness);

/*
 * Get a specific activity.
 */
router.get("/business/:businessId/:activityId", [...businessIdValidator, ...activityIdValidator], validate, requireBusinessMembership, requirePermission("activities.view"), activityController.getActivityById);

/*
 * Update an activity.
 */
router.patch("/business/:businessId/:activityId", updateActivityValidator, validate, requireBusinessMembership, requirePermission("activities.update"), activityController.updateActivity);

/*
 * Complete an activity.
 */
router.patch("/business/:businessId/:activityId/complete", completeActivityValidator, validate, requireBusinessMembership, requirePermission("activities.complete"), activityController.completeActivity);

/*
 * Delete an activity.
 */
router.delete("/business/:businessId/:activityId", [...businessIdValidator, ...activityIdValidator], validate, requireBusinessMembership, requireManagementRole, requirePermission("activities.delete"), activityController.deleteActivity);

module.exports = router;
