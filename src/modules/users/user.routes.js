const express = require("express");

const userController = require("./user.controller");
const { updateMyProfileValidator } = require("./user.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const router = express.Router();

router.use(auth);

router.get("/me", userController.getMyProfile);

router.patch("/me", updateMyProfileValidator, validate, userController.updateMyProfile);

module.exports = router;
