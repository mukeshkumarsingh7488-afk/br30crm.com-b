const crypto = require("crypto");

const cloudinary = require("../../config/cloudinary");
const env = require("../../config/env");

const PROFILE_IMAGE_FOLDER = "universal-crm/profile-images";

const getProfileImagePublicId = (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate profile image public ID.");
  }

  return `${PROFILE_IMAGE_FOLDER}/${userId.toString()}`;
};

const generateProfileImageSignature = (userId) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = getProfileImagePublicId(userId);

  const paramsToSign = {
    folder: PROFILE_IMAGE_FOLDER,
    public_id: publicId,
    overwrite: true,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.cloudinary.apiSecret);

  return {
    timestamp,
    folder: PROFILE_IMAGE_FOLDER,
    publicId,
    signature,
    overwrite: true,
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
  };
};

const deleteProfileImage = async (publicId) => {
  if (!publicId) {
    return {
      success: true,
      result: "not_found",
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  PROFILE_IMAGE_FOLDER,
  getProfileImagePublicId,
  generateProfileImageSignature,
  deleteProfileImage,
};
