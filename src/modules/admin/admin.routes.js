const express = require("express");

const auth = require("../../middleware/auth");
const { requireMasterAdmin } = require("../../middleware/authorization");

const adminController = require("./admin.controller");

const router = express.Router();

router.use(auth);
router.use(requireMasterAdmin);

router.get("/overview", adminController.getDashboard);

router.get("/users/:id", adminController.getUser);

router.patch("/users/:id", adminController.updateUser);

router.patch("/users/:id/status", adminController.updateUserStatus);

router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
