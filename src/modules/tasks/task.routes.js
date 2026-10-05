const express = require("express");

const taskController = require("./task.controller");

const { createTaskValidator, updateTaskValidator, taskIdValidator, assignTaskValidator, paginationValidators } = require("./task.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Create a task.
 */
router.post("/business/:businessId", createTaskValidator, validate, requireBusinessMembership, requirePermission("tasks.create"), taskController.createTask);

/*
 * Get all tasks of a business.
 */
router.get("/business/:businessId", paginationValidators, validate, requireBusinessMembership, requirePermission("tasks.view"), taskController.getTasksByBusiness);

/*
 * Get a specific task.
 */
router.get("/business/:businessId/:taskId", taskIdValidator, validate, requireBusinessMembership, requirePermission("tasks.view"), taskController.getTaskById);

/*
 * Update a task.
 */
router.patch("/business/:businessId/:taskId", updateTaskValidator, validate, requireBusinessMembership, requirePermission("tasks.update"), taskController.updateTask);

/*
 * Delete a task.
 */
router.delete("/business/:businessId/:taskId", taskIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("tasks.delete"), taskController.deleteTask);

/*
 * Assign / reassign a task.
 */
router.post("/business/:businessId/:taskId/assign", assignTaskValidator, validate, requireBusinessMembership, requirePermission("tasks.assign"), taskController.assignTask);

/*
 * Unassign a task.
 */
router.post("/business/:businessId/:taskId/unassign", taskIdValidator, validate, requireBusinessMembership, requirePermission("tasks.assign"), taskController.unassignTask);

/*
 * Complete a task.
 */
router.post("/business/:businessId/:taskId/complete", taskIdValidator, validate, requireBusinessMembership, requirePermission("tasks.complete"), taskController.completeTask);

module.exports = router;
