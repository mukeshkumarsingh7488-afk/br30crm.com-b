const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const pipelineIdValidator = [param("pipelineId").trim().notEmpty().withMessage("Pipeline ID is required").isMongoId().withMessage("Invalid pipeline ID")];

const stageIdValidator = [param("stageId").trim().notEmpty().withMessage("Stage ID is required").isMongoId().withMessage("Invalid stage ID")];

const stageFieldsValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Stage name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Stage name must be between 2 and 100 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Stage description cannot exceed 500 characters"),

  body("probability")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Probability must be between 0 and 100")
    .toFloat(),

  body("color")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage("Stage color cannot exceed 30 characters"),

  body("isClosed").optional().isBoolean().withMessage("isClosed must be a boolean").toBoolean(),

  body("isWon").optional().isBoolean().withMessage("isWon must be a boolean").toBoolean(),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean").toBoolean(),

  body("order")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage("Order must be a non-negative integer")
    .toInt(),
];

const createPipelineValidator = [
  ...businessIdValidator,

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Pipeline name is required")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Pipeline name must be between 2 and 150 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Description cannot exceed 1000 characters"),

  body("type").optional().isIn(["SALES", "SERVICE", "CUSTOM"]).withMessage("Invalid pipeline type"),

  body("stages")
    .optional()
    .isArray({
      max: 100,
    })
    .withMessage("Stages must be an array with maximum 100 stages"),

  body("stages.*.name")
    .if(body("stages").exists())
    .trim()
    .notEmpty()
    .withMessage("Stage name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Stage name must be between 2 and 100 characters"),

  body("stages.*.description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Stage description cannot exceed 500 characters"),

  body("stages.*.probability")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Stage probability must be between 0 and 100")
    .toFloat(),

  body("stages.*.color")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage("Stage color cannot exceed 30 characters"),

  body("stages.*.isClosed").optional().isBoolean().withMessage("Stage isClosed must be a boolean").toBoolean(),

  body("stages.*.isWon").optional().isBoolean().withMessage("Stage isWon must be a boolean").toBoolean(),

  body("stages.*.isActive").optional().isBoolean().withMessage("Stage isActive must be a boolean").toBoolean(),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean").toBoolean(),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid pipeline status"),
];

const updatePipelineValidator = [
  ...businessIdValidator,
  ...pipelineIdValidator,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Pipeline name cannot be empty")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Pipeline name must be between 2 and 150 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Description cannot exceed 1000 characters"),

  body("type").optional().isIn(["SALES", "SERVICE", "CUSTOM"]).withMessage("Invalid pipeline type"),

  body("stages")
    .optional()
    .isArray({
      max: 100,
    })
    .withMessage("Stages must be an array with maximum 100 stages"),

  body("stages.*.name")
    .if(body("stages").exists())
    .trim()
    .notEmpty()
    .withMessage("Stage name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Stage name must be between 2 and 100 characters"),

  body("stages.*.description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Stage description cannot exceed 500 characters"),

  body("stages.*.probability")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Stage probability must be between 0 and 100")
    .toFloat(),

  body("stages.*.color")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage("Stage color cannot exceed 30 characters"),

  body("stages.*.isClosed").optional().isBoolean().withMessage("Stage isClosed must be a boolean").toBoolean(),

  body("stages.*.isWon").optional().isBoolean().withMessage("Stage isWon must be a boolean").toBoolean(),

  body("stages.*.isActive").optional().isBoolean().withMessage("Stage isActive must be a boolean").toBoolean(),

  body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean").toBoolean(),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid pipeline status"),
];

const getPipelinesValidator = [
  ...businessIdValidator,

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be at least 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Search cannot exceed 100 characters"),

  query("type").optional().isIn(["SALES", "SERVICE", "CUSTOM"]).withMessage("Invalid pipeline type"),

  query("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid pipeline status"),

  query("includeInactive").optional().isBoolean().withMessage("includeInactive must be a boolean").toBoolean(),
];

const getPipelineValidator = [...businessIdValidator, ...pipelineIdValidator];

const addStageValidator = [...businessIdValidator, ...pipelineIdValidator, ...stageFieldsValidator];

const updateStageValidator = [
  ...businessIdValidator,
  ...pipelineIdValidator,
  ...stageIdValidator,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Stage name cannot be empty")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Stage name must be between 2 and 100 characters"),

  body("description")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Stage description cannot exceed 500 characters"),

  body("probability")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Probability must be between 0 and 100")
    .toFloat(),

  body("color")
    .optional({
      values: "null",
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage("Stage color cannot exceed 30 characters"),

  body("isClosed").optional().isBoolean().withMessage("isClosed must be a boolean").toBoolean(),

  body("isWon").optional().isBoolean().withMessage("isWon must be a boolean").toBoolean(),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean").toBoolean(),

  body("order")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage("Order must be a non-negative integer")
    .toInt(),
];

const deleteStageValidator = [...businessIdValidator, ...pipelineIdValidator, ...stageIdValidator];

const deletePipelineValidator = [...businessIdValidator, ...pipelineIdValidator];

module.exports = {
  businessIdValidator,
  pipelineIdValidator,
  stageIdValidator,
  createPipelineValidator,
  updatePipelineValidator,
  getPipelinesValidator,
  getPipelineValidator,
  addStageValidator,
  updateStageValidator,
  deleteStageValidator,
  deletePipelineValidator,
};
