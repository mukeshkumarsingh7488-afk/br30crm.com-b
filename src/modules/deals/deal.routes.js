const express = require("express");

const dealController = require("./deal.controller");

const { createDealValidator, listDealsValidator, getDealValidator, updateDealValidator, assignDealValidator, moveDealValidator } = require("./deal.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.post("/business/:businessId", createDealValidator, validate, requireBusinessMembership, requirePermission("deals.create"), dealController.createDeal);

router.get("/business/:businessId", listDealsValidator, validate, requireBusinessMembership, requirePermission("deals.view"), dealController.getDealsByBusiness);

router.get("/business/:businessId/:dealId", getDealValidator, validate, requireBusinessMembership, requirePermission("deals.view"), dealController.getDealById);

router.patch("/business/:businessId/:dealId", updateDealValidator, validate, requireBusinessMembership, requirePermission("deals.update"), dealController.updateDeal);

router.delete("/business/:businessId/:dealId", getDealValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("deals.delete"), dealController.deleteDeal);

router.post("/business/:businessId/:dealId/assign", assignDealValidator, validate, requireBusinessMembership, requirePermission("deals.assign"), dealController.assignDeal);

router.post("/business/:businessId/:dealId/move", moveDealValidator, validate, requireBusinessMembership, requirePermission("deals.update"), dealController.moveDeal);

module.exports = router;
