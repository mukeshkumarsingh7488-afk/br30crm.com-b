const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");
const { runWithRequestContext } = require("../events/requestContext");

const auth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required."));
  }

  const token = authorization.substring(7).trim();

  if (!token) {
    return next(new ApiError(401, "Authentication token is missing."));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;

    return runWithRequestContext(
      { userId: decoded.userId, requestId: req.requestId || null },
      next
    );
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired access token."));
  }
};

module.exports = auth;
