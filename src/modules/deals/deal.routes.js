const express = require("express");

const dealController = require("./deal.controller");

const { createDealValidator, listDealsValidator, getDealValidator, updateDealValidator, assignDealValidator, moveDealValidator } = require("./deal.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

/*
 * Create a new deal.
 */
router.post("/business/:businessId", createDealValidator, validate, requireBusinessMembership, requirePermission("deals.create"), dealController.createDeal);

/*
 * Get all deals of a business.
 */
router.get("/business/:businessId", listDealsValidator, validate, requireBusinessMembership, requirePermission("deals.view"), dealController.getDealsByBusiness);

/*
 * Get a specific deal.
 */
router.get("/business/:businessId/:dealId", getDealValidator, validate, requireBusinessMembership, requirePermission("deals.view"), dealController.getDealById);

/*
 * Update a deal.
 */
router.patch("/business/:businessId/:dealId", updateDealValidator, validate, requireBusinessMembership, requirePermission("deals.update"), dealController.updateDeal);

/*
 * Delete/deactivate a deal.
 */
router.delete("/business/:businessId/:dealId", getDealValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("deals.delete"), dealController.deleteDeal);

/*
 * Assign a deal to a business user.
 */
router.post("/business/:businessId/:dealId/assign", assignDealValidator, validate, requireBusinessMembership, requirePermission("deals.assign"), dealController.assignDeal);

/*
 * Move a deal to another pipeline stage.
 */
router.post("/business/:businessId/:dealId/move", moveDealValidator, validate, requireBusinessMembership, requirePermission("deals.update"), dealController.moveDeal);

module.exports = router;
