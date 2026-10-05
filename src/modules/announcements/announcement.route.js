const express = require("express");

const announcementController = require("./announcement.controller");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { announcementIdValidator, slugParamValidator, createAnnouncementValidator, updateAnnouncementValidator, listAnnouncementValidator } = require("./announcement.validator");

const router = express.Router();

/*
 * Public What's New feed
 *
 * No authentication required.
 */
router.get("/public", listAnnouncementValidator, validate, announcementController.getPublicAnnouncements);

/*
 * Authenticated announcement routes
 */
router.use(auth);

/*
 * All announcements available to authenticated users
 */
router.get("/", listAnnouncementValidator, validate, announcementController.getAnnouncements);

/*
 * Create announcement
 */
router.post("/", createAnnouncementValidator, validate, announcementController.createAnnouncement);

/*
 * Announcement by slug
 */
router.get("/slug/:slug", slugParamValidator, validate, announcementController.getAnnouncementBySlug);

/*
 * Publish announcement
 */
router.patch("/:announcementId/publish", announcementIdValidator, validate, announcementController.publishAnnouncement);

/*
 * Archive announcement
 */
router.patch("/:announcementId/archive", announcementIdValidator, validate, announcementController.archiveAnnouncement);

/*
 * Update announcement
 */
router.patch("/:announcementId", updateAnnouncementValidator, validate, announcementController.updateAnnouncement);

/*
 * Archive/delete announcement
 *
 * We intentionally archive instead of physically deleting,
 * so release history remains available.
 */
router.delete("/:announcementId", announcementIdValidator, validate, announcementController.deleteAnnouncement);

/*
 * Announcement by ID
 */
router.get("/:announcementId", announcementIdValidator, validate, announcementController.getAnnouncementById);

module.exports = router;
