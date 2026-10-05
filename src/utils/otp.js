const crypto = require("crypto");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return crypto.randomInt(min, max).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const getOtpExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

const isOtpExpired = (expiresAt) => {
  return !expiresAt || new Date(expiresAt).getTime() < Date.now();
};

module.exports = {
  generateOtp,
  hashOtp,
  getOtpExpiry,
  isOtpExpired,
  OTP_EXPIRY_MINUTES,
};
