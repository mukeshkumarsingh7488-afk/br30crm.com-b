const express = require("express");

const noteController = require("./note.controller");

const { createNoteValidator, updateNoteValidator, noteIdValidator, paginationValidators } = require("./note.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const { requireBusinessMembership } = require("../../middleware/authorization");
const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.post("/business/:businessId", createNoteValidator, validate, requireBusinessMembership, requirePermission("notes.create"), noteController.createNote);

router.get("/business/:businessId", paginationValidators, validate, requireBusinessMembership, requirePermission("notes.view"), noteController.getNotesByBusiness);

router.get("/business/:businessId/:noteId", noteIdValidator, validate, requireBusinessMembership, requirePermission("notes.view"), noteController.getNoteById);

router.patch("/business/:businessId/:noteId", updateNoteValidator, validate, requireBusinessMembership, requirePermission("notes.update"), noteController.updateNote);

router.patch("/business/:businessId/:noteId/pin", noteIdValidator, validate, requireBusinessMembership, requirePermission("notes.update"), noteController.togglePinNote);

router.patch("/business/:businessId/:noteId/archive", noteIdValidator, validate, requireBusinessMembership, requirePermission("notes.update"), noteController.archiveNote);

router.delete("/business/:businessId/:noteId", noteIdValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("notes.delete"), noteController.deleteNote);

module.exports = router;
