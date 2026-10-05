const express = require("express");

const businessController = require("./business.controller");

const { businessIdValidator, createBusinessValidator, updateBusinessValidator, updateBusinessStatusValidator } = require("./business.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership, requireBusinessOwner } = require("../../middleware/authorization");

const router = express.Router();

router.use(auth);

router.post("/", createBusinessValidator, validate, businessController.createBusiness);

router.get("/", businessController.getMyBusinesses);

router.get("/:businessId", businessIdValidator, validate, requireBusinessMembership, businessController.getBusinessById);

router.patch("/:businessId", updateBusinessValidator, validate, requireBusinessOwner, businessController.updateBusiness);

router.patch("/:businessId/status", updateBusinessStatusValidator, validate, requireBusinessOwner, businessController.updateBusinessStatus);

module.exports = router;
