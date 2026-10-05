const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const taskService = require("./task.service");

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    ...req.body,
    businessId: req.params.businessId,
    createdBy: req.user.userId,
  });

  return ApiResponse.created(res, { task }, "Task created successfully.");
});

const getTasksByBusiness = asyncHandler(async (req, res) => {
  const result = await taskService.getTasksByBusiness(req.params.businessId, {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    priority: req.query.priority,
    assignedTo: req.query.assignedTo,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    access: { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name },
  });

  return ApiResponse.success(res, result, "Tasks fetched successfully.");
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId, req.params.businessId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task fetched successfully.");
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.taskId, req.params.businessId, req.body, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task updated successfully.");
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.taskId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task deleted successfully.");
});

const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(req.params.taskId, req.params.businessId, req.body.assignedTo, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task assigned successfully.");
});

const unassignTask = asyncHandler(async (req, res) => {
  const task = await taskService.unassignTask(req.params.taskId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task unassigned successfully.");
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await taskService.completeTask(req.params.taskId, req.params.businessId, req.user.userId, { userId: req.user.userId, isBusinessOwner: req.isBusinessOwner === true, roleSlug: req.role?.slug, roleName: req.role?.name });

  return ApiResponse.success(res, { task }, "Task completed successfully.");
});

module.exports = {
  createTask,
  getTasksByBusiness,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  completeTask,
};
