const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      details: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
      requestId: req.requestId || null,
    });
  }

  next();
};

module.exports = validate;
