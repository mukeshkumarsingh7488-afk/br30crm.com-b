const express = require("express");

const announcementController = require("./announcement.controller");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { announcementIdValidator, slugParamValidator, createAnnouncementValidator, updateAnnouncementValidator, listAnnouncementValidator } = require("./announcement.validator");

const router = express.Router();

router.get("/public", listAnnouncementValidator, validate, announcementController.getPublicAnnouncements);

router.use(auth);

router.get("/", listAnnouncementValidator, validate, announcementController.getAnnouncements);

router.post("/", createAnnouncementValidator, validate, announcementController.createAnnouncement);

router.get("/slug/:slug", slugParamValidator, validate, announcementController.getAnnouncementBySlug);

router.patch("/:announcementId/publish", announcementIdValidator, validate, announcementController.publishAnnouncement);

router.patch("/:announcementId/archive", announcementIdValidator, validate, announcementController.archiveAnnouncement);

router.patch("/:announcementId", updateAnnouncementValidator, validate, announcementController.updateAnnouncement);

router.delete("/:announcementId", announcementIdValidator, validate, announcementController.deleteAnnouncement);

router.get("/:announcementId", announcementIdValidator, validate, announcementController.getAnnouncementById);

module.exports = router;
