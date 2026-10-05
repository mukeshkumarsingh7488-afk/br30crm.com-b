const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const adminService = require("./admin.service");

/*
 * ============================================================
 * ADMIN DASHBOARD / USERS LIST
 * ============================================================
 */

const getDashboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const stats = await adminService.getDashboardStats({
    page,
    limit,
  });

  return ApiResponse.success(
    res,
    {
      stats,

      admin: {
        userId: req.user.userId,
        isMasterAdmin: req.isMasterAdmin === true,
      },
    },
    "Master Admin dashboard data fetched successfully."
  );
});

/*
 * ============================================================
 * GET USER DETAIL
 * ============================================================
 */

const getUser = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);

  return ApiResponse.success(
    res,
    {
      user,
    },
    "User details fetched successfully."
  );
});

/*
 * ============================================================
 * UPDATE USER
 * ============================================================
 */

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
  });

  return ApiResponse.success(
    res,
    {
      user,
    },
    "User updated successfully."
  );
});

/*
 * ============================================================
 * BLOCK / UNBLOCK / STATUS
 * ============================================================
 */

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const user = await adminService.updateUserStatus(req.params.id, status);

  return ApiResponse.success(
    res,
    {
      user,
    },
    `User status changed to ${status}.`
  );
});

/*
 * ============================================================
 * DELETE USER
 * ============================================================
 */

const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id, req.user.userId);

  return ApiResponse.success(res, result, "User deleted successfully.");
});

module.exports = {
  getDashboard,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
