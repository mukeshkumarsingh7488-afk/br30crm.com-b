const { body, param, query } = require("express-validator");

const allowedFieldTypes = ["name", "text", "email", "phone", "number", "textarea", "select", "date"];

const validateFields = (fields) => {
  if (!Array.isArray(fields) || fields.length < 1) {
    throw new Error("At least one public form field is required.");
  }

  const keys = new Set();

  for (const field of fields) {
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      throw new Error("Each form field must be an object.");
    }

    const key = String(field.key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!key) {
      throw new Error("Every public form field requires a valid key.");
    }

    if (key.length > 80) {
      throw new Error("Public form field key cannot exceed 80 characters.");
    }

    if (keys.has(key)) {
      throw new Error("Public form field keys must be unique.");
    }

    keys.add(key);

    const label = String(field.label || "").trim();

    if (!label) {
      throw new Error("Every public form field requires a label.");
    }

    if (label.length > 120) {
      throw new Error("Public form field label cannot exceed 120 characters.");
    }

    const type = field.type || "text";

    if (!allowedFieldTypes.includes(type)) {
      throw new Error(`Invalid public form field type: ${type}`);
    }

    if (field.options !== undefined && !Array.isArray(field.options)) {
      throw new Error(`Options for "${label}" must be an array.`);
    }

    if (type === "select" && (!Array.isArray(field.options) || field.options.length === 0)) {
      throw new Error(`Select field "${label}" requires options.`);
    }

    if (Array.isArray(field.options) && field.options.length > 100) {
      throw new Error(`Field "${label}" cannot have more than 100 options.`);
    }

    if (field.placeholder !== undefined && field.placeholder !== null && String(field.placeholder).length > 200) {
      throw new Error(`Placeholder for "${label}" is too long.`);
    }

    if (field.helpText !== undefined && field.helpText !== null && String(field.helpText).length > 500) {
      throw new Error(`Help text for "${label}" is too long.`);
    }
  }

  return true;
};

const optionalUrl = (value) => {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  try {
    const url = new URL(String(value));

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP/HTTPS URLs are allowed.");
    }

    return true;
  } catch {
    throw new Error("A valid HTTP/HTTPS URL is required.");
  }
};

const optionalObject = (value) => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Value must be an object.");
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Management
|--------------------------------------------------------------------------
*/

exports.list = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),

  query("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid form status."),

  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage("Search cannot exceed 100 characters."),
];

exports.create = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),

  body("name")
    .isString()
    .trim()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Form name must be between 2 and 150 characters."),

  body("slug")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      min: 2,
      max: 180,
    })
    .withMessage("Invalid form slug."),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage("Description is too long."),

  body("purpose")
    .optional()
    .isIn(["LEAD", "SUPPORT"])
    .withMessage("Invalid form purpose."),

  body("fields").custom(validateFields),

  body("source")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage("Source is too long."),

  body("campaign")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 200,
    })
    .withMessage("Campaign is too long."),

  body("successMessage")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Success message is too long."),

  body("redirectUrl")
    .optional({
      nullable: true,
    })
    .custom(optionalUrl),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid form status."),

  body("spamProtection").optional().isBoolean().withMessage("spamProtection must be boolean."),

  body("settings")
    .optional({
      nullable: true,
    })
    .custom(optionalObject),
];

exports.update = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),

  param("formId").isMongoId().withMessage("Invalid form ID."),

  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Form name must be between 2 and 150 characters."),

  body("slug")
    .optional()
    .isString()
    .trim()
    .isLength({
      min: 2,
      max: 180,
    })
    .withMessage("Invalid form slug."),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage("Description is too long."),

  body("purpose")
    .optional()
    .isIn(["LEAD", "SUPPORT"])
    .withMessage("Invalid form purpose."),

  body("fields").optional().custom(validateFields),

  body("source")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 150,
    }),

  body("campaign")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 200,
    }),

  body("successMessage")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 500,
    }),

  body("redirectUrl")
    .optional({
      nullable: true,
    })
    .custom(optionalUrl),

  body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid form status."),

  body("spamProtection").optional().isBoolean().withMessage("spamProtection must be boolean."),

  body("settings")
    .optional({
      nullable: true,
    })
    .custom(optionalObject),
];

exports.byId = [param("businessId").isMongoId().withMessage("Invalid business ID."), param("formId").isMongoId().withMessage("Invalid form ID.")];

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

exports.publicGet = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),

  param("slug")
    .isString()
    .trim()
    .isLength({
      min: 1,
      max: 180,
    })
    .withMessage("Invalid public form slug."),
];

exports.publicSubmit = [
  param("businessId").isMongoId().withMessage("Invalid business ID."),

  param("slug")
    .isString()
    .trim()
    .isLength({
      min: 1,
      max: 180,
    })
    .withMessage("Invalid public form slug."),

  body().custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Form submission must be an object.");
    }

    return true;
  }),
];
