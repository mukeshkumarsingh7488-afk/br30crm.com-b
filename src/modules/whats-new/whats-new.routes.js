const express = require("express");

const auth = require("../../middleware/auth");
const { requireMasterAdmin } = require("../../middleware/authorization");
const validate = require("../../middleware/validation");
const { requirePermission } = require("../../middleware/permission");

const whatsNewController = require("./whats-new.controller");

const { objectIdValidator, slugValidator, createWhatsNewValidator, updateWhatsNewValidator, listWhatsNewValidator, statusValidator } = require("./whats-new.validator");

const router = express.Router();

/*
 * ============================================================
 * PUBLIC ROUTES
 * ============================================================
 */

/*
 * GET /api/v1/whatsnew
 */

router.get("/", listWhatsNewValidator, validate, whatsNewController.getPublicWhatsNew);

/*
 * GET /api/v1/whatsnew/slug/:slug
 */

router.get("/slug/:slug", slugValidator, validate, whatsNewController.getPublicWhatsNewBySlug);

/*
 * ============================================================
 * ADMIN AUTHENTICATION
 * ============================================================
 */

router.use(auth);

router.use(requireMasterAdmin);

/*
 * ============================================================
 * ADMIN LIST
 * ============================================================
 */

router.get("/admin", listWhatsNewValidator, validate, requirePermission("whatsnew.view"), whatsNewController.getAllWhatsNew);

/*
 * ============================================================
 * ADMIN GET ONE
 * ============================================================
 */

router.get("/admin/:whatsNewId", objectIdValidator, validate, requirePermission("whatsnew.view"), whatsNewController.getWhatsNewById);

/*
 * ============================================================
 * ADMIN CREATE
 * ============================================================
 *
 * JSON body
 *
 * IMAGE:
 * imageUrl = Cloudinary/public image URL
 *
 * VIDEO:
 * videoUrl = YouTube public video URL
 *
 * No multipart/form-data.
 * No Multer.
 */

/*
 * POST /api/v1/whatsnew/admin
 */

router.post("/admin", requirePermission("whatsnew.create"), createWhatsNewValidator, validate, whatsNewController.createWhatsNew);

/*
 * ============================================================
 * ADMIN UPDATE
 * ============================================================
 *
 * JSON body
 *
 * IMAGE:
 * imageUrl = Cloudinary/public image URL
 *
 * If imageUrl is not provided while editing an IMAGE item,
 * the existing imageUrl will be preserved by the service.
 *
 * VIDEO:
 * videoUrl = YouTube public video URL
 *
 * No multipart/form-data.
 * No Multer.
 */

/*
 * PATCH /api/v1/whatsnew/admin/:whatsNewId
 */

router.patch("/admin/:whatsNewId", requirePermission("whatsnew.update"), updateWhatsNewValidator, validate, whatsNewController.updateWhatsNew);

/*
 * ============================================================
 * ADMIN STATUS
 * ============================================================
 */

router.patch("/admin/:whatsNewId/status", statusValidator, validate, requirePermission("whatsnew.update"), whatsNewController.updateStatus);

/*
 * ============================================================
 * ADMIN DELETE / ARCHIVE
 * ============================================================
 */

router.delete("/admin/:whatsNewId", objectIdValidator, validate, requirePermission("whatsnew.delete"), whatsNewController.deleteWhatsNew);

module.exports = router;
