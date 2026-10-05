const express = require("express");

const auth = require("../../middleware/auth");
const { requireMasterAdmin } = require("../../middleware/authorization");

const adminController = require("./admin.controller");

const router = express.Router();

/*
 * ============================================================
 * MASTER ADMIN PROTECTION
 * ============================================================
 */

router.use(auth);
router.use(requireMasterAdmin);

/*
 * ============================================================
 * DASHBOARD / USERS LIST
 * ============================================================
 *
 * GET /api/v1/admin/overview?page=1&limit=20
 */

router.get("/overview", adminController.getDashboard);

/*
 * ============================================================
 * USER DETAIL
 * ============================================================
 *
 * GET /api/v1/admin/users/:id
 */

router.get("/users/:id", adminController.getUser);

/*
 * ============================================================
 * UPDATE USER
 * ============================================================
 *
 * PATCH /api/v1/admin/users/:id
 *
 * Body:
 * {
 *   "name": "Mukesh Kumar",
 *   "email": "example@email.com",
 *   "phone": "+919999999999"
 * }
 */

router.patch("/users/:id", adminController.updateUser);

/*
 * ============================================================
 * BLOCK / UNBLOCK USER
 * ============================================================
 *
 * PATCH /api/v1/admin/users/:id/status
 *
 * Body:
 * {
 *   "status": "SUSPENDED"
 * }
 *
 * ACTIVE     = Unblock / Active
 * INACTIVE   = Inactive
 * SUSPENDED  = Block
 */

router.patch("/users/:id/status", adminController.updateUserStatus);

/*
 * ============================================================
 * DELETE USER
 * ============================================================
 *
 * DELETE /api/v1/admin/users/:id
 */

router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
