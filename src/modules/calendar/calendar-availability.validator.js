const { param, body, query } = require("express-validator");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const businessIdValidator = [param("businessId").matches(objectIdRegex).withMessage("Invalid business ID.")];
const userIdValidator = [param("userId").matches(objectIdRegex).withMessage("Invalid user ID.")];
const saveValidator = [
  ...businessIdValidator,
  ...userIdValidator,
  body("timezone").optional().trim().isLength({ max: 100 }).withMessage("Timezone cannot exceed 100 characters."),
  body("workingDays").optional().isArray({ max: 7 }).withMessage("workingDays must be an array."),
  body("workingDays.*").optional().isInt({ min: 0, max: 6 }).withMessage("Invalid working day."),
  body("workingHours").optional().isObject().withMessage("workingHours must be an object."),
  body("workingHours.start")
    .optional()
    .matches(/^([01]\\d|2[0-3]):[0-5]\\d$/)
    .withMessage("Invalid working hours start."),
  body("workingHours.end")
    .optional()
    .matches(/^([01]\\d|2[0-3]):[0-5]\\d$/)
    .withMessage("Invalid working hours end."),
  body("breaks").optional().isArray({ max: 20 }).withMessage("Breaks must be an array."),
];
const queryValidator = [...businessIdValidator, ...userIdValidator, query("from").isISO8601().withMessage("Invalid from date."), query("to").isISO8601().withMessage("Invalid to date.")];
module.exports = { businessIdValidator, userIdValidator, saveValidator, queryValidator };
