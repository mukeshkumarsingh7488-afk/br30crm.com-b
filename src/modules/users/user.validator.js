const { body } = require("express-validator");

const updateMyProfileValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

  body("phone").optional({ values: "null" }).trim().isLength({ max: 30 }).withMessage("Phone cannot exceed 30 characters"),

  body("profileImage").optional({ values: "null" }).trim().isURL().withMessage("Profile image must be a valid URL"),
];

module.exports = {
  updateMyProfileValidator,
};
