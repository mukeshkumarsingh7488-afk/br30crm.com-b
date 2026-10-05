const User = require("./user.model");

const SENSITIVE_FIELDS =
  "+password " + "+emailVerificationOtpHash " + "+emailVerificationOtpExpiresAt " + "+emailVerificationAttempts " + "+emailVerificationLastSentAt " + "+passwordResetOtpHash " + "+passwordResetOtpExpiresAt " + "+passwordResetAttempts " + "+passwordResetLastSentAt " + "+refreshTokenHash";

const createUser = async (userData) => {
  return User.create(userData);
};

const findUserByEmail = async (email, includeSensitive = false) => {
  const query = User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (includeSensitive) {
    query.select(SENSITIVE_FIELDS);
  }

  return query;
};

const findUserById = async (userId, includeSensitive = false) => {
  const query = User.findById(userId);

  if (includeSensitive) {
    query.select(SENSITIVE_FIELDS);
  }

  return query;
};

const updateUserById = async (userId, updates) => {
  return User.findByIdAndUpdate(userId, updates, {
    returnDocument: "after",
    runValidators: true,
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserById,
};
