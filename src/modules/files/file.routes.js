const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");
const validate = require("../../middleware/validation");

const fileController = require("./file.controller");

const { createFileValidator, listFileValidator, fileIdValidator, updateFileValidator } = require("./file.validator");

router.use(auth);

router.post("/business/:businessId", createFileValidator, validate, requireBusinessMembership, requirePermission("files.create"), fileController.createFile);

router.get("/business/:businessId", listFileValidator, validate, requireBusinessMembership, requirePermission("files.view"), fileController.getFiles);

router.get("/business/:businessId/:fileId", fileIdValidator, validate, requireBusinessMembership, requirePermission("files.view"), fileController.getFileById);

router.patch("/business/:businessId/:fileId", updateFileValidator, validate, requireBusinessMembership, requirePermission("files.update"), fileController.updateFile);

router.delete("/business/:businessId/:fileId", fileIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("files.delete"), fileController.deleteFile);

router.patch("/business/:businessId/:fileId/restore", fileIdValidator, validate, requireBusinessMembership, requirePermission("files.update"), fileController.restoreFile);

module.exports = router;
