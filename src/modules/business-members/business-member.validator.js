const { body, param, query } = require("express-validator");

const businessIdValidator = [param("businessId").trim().notEmpty().withMessage("Business ID is required").isMongoId().withMessage("Invalid business ID")];

const memberIdValidator = [param("memberId").trim().notEmpty().withMessage("Member ID is required").isMongoId().withMessage("Invalid member ID")];

const paginationValidators = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),

  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),

  query("status").optional().isIn(["ACTIVE", "INACTIVE", "SUSPENDED"]).withMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED"),
];

const addMemberValidator = [
  ...businessIdValidator,

  body("userId").trim().notEmpty().withMessage("User ID is required").isMongoId().withMessage("Invalid user ID"),

  body("roleId").optional({ values: "null" }).trim().isMongoId().withMessage("Invalid role ID"),

  body("status").optional().isIn(["ACTIVE", "INACTIVE", "SUSPENDED"]).withMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED"),
];

const updateMemberValidator = [
  ...memberIdValidator,

  body("roleId")
    .optional({ values: "null" })
    .custom((value) => {
      if (value === null) {
        return true;
      }

      if (!/^[a-f\d]{24}$/i.test(value)) {
        throw new Error("Invalid role ID");
      }

      return true;
    }),

  body("status").optional().isIn(["ACTIVE", "INACTIVE", "SUSPENDED"]).withMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED"),
];

const memberDetailsValidator = [...memberIdValidator];

module.exports = {
  businessIdValidator,
  memberIdValidator,
  paginationValidators,
  addMemberValidator,
  updateMemberValidator,
  memberDetailsValidator,
};
