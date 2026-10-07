const express = require("express");

const auth = require("../../middleware/auth");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const validate = require("../../middleware/validation");

const c = require("./meeting.controller");

const { listMeetingValidator, businessIdValidator, meetingIdValidator, createMeetingValidator, updateMeetingValidator } = require("./meeting.validator");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", listMeetingValidator, validate, requireBusinessMembership, requirePermission("meetings.view"), c.list);

router.get("/business/:businessId/:meetingId", [...businessIdValidator, ...meetingIdValidator], validate, requireBusinessMembership, requirePermission("meetings.view"), c.getById);

router.post("/business/:businessId", createMeetingValidator, validate, requireBusinessMembership, requirePermission("meetings.create"), c.create);

router.patch("/business/:businessId/:meetingId", updateMeetingValidator, validate, requireBusinessMembership, requirePermission("meetings.update"), c.update);

router.delete("/business/:businessId/:meetingId", [...businessIdValidator, ...meetingIdValidator], validate, requireBusinessMembership, requireManagementRole, requirePermission("meetings.delete"), c.remove);

module.exports = router;
