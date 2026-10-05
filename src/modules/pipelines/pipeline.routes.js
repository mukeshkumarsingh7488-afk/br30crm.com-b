const express = require("express");

const pipelineController = require("./pipeline.controller");

const { createPipelineValidator, updatePipelineValidator, getPipelinesValidator, getPipelineValidator, addStageValidator, updateStageValidator, deleteStageValidator, deletePipelineValidator } = require("./pipeline.validator");

const auth = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const { requireBusinessMembership } = require("../../middleware/authorization");

const { requirePermission, requireManagementRole } = require("../../middleware/permission");

const router = express.Router();

router.use(auth);

router.get("/business/:businessId", getPipelinesValidator, validate, requireBusinessMembership, requirePermission("pipelines.view"), pipelineController.getPipelinesByBusiness);

router.post("/business/:businessId", createPipelineValidator, validate, requireBusinessMembership, requirePermission("pipelines.create"), pipelineController.createPipeline);

router.get("/business/:businessId/:pipelineId", getPipelineValidator, validate, requireBusinessMembership, requirePermission("pipelines.view"), pipelineController.getPipelineById);

router.patch("/business/:businessId/:pipelineId", updatePipelineValidator, validate, requireBusinessMembership, requirePermission("pipelines.update"), pipelineController.updatePipeline);

router.post("/business/:businessId/:pipelineId/stages", addStageValidator, validate, requireBusinessMembership, requirePermission("pipelines.update"), pipelineController.addStage);

router.patch("/business/:businessId/:pipelineId/stages/:stageId", updateStageValidator, validate, requireBusinessMembership, requirePermission("pipelines.update"), pipelineController.updateStage);

router.delete("/business/:businessId/:pipelineId/stages/:stageId", deleteStageValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("pipelines.update"), pipelineController.deleteStage);

router.delete("/business/:businessId/:pipelineId", deletePipelineValidator, validate, requireBusinessMembership, requireManagementRole, requirePermission("pipelines.delete"), pipelineController.deletePipeline);

module.exports = router;
