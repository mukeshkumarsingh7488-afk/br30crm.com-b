const express = require("express");

const userController = require("./user.controller");
const { updateMyProfileValidator } = require("./user.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const router = express.Router();

router.use(auth);

/*
 * Get logged-in user's profile.
 */
router.get("/me", userController.getMyProfile);

/*
 * Update logged-in user's profile.
 */
router.patch("/me", updateMyProfileValidator, validate, userController.updateMyProfile);

module.exports = router;
