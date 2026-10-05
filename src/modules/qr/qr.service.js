const mongoose = require("mongoose");
const QRCode = require("qrcode");

const FormQrCode = require("./qr.model");
const PublicForm = require("../public-forms/public-form.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");

const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const ensureBusiness = async (businessId, userId) => {
  if (!validId(businessId)) {
    throw new ApiError(400, "Invalid business ID.");
  }

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  const member = await BusinessMember.exists({
    businessId,
    userId,
    status: "ACTIVE",
  });

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business.");
  }

  return business;
};

const getForm = async (businessId, formId) => {
  if (!validId(formId)) {
    throw new ApiError(400, "Invalid form ID.");
  }

  const form = await PublicForm.findOne({
    _id: formId,
    businessId,
  }).lean();

  if (!form) {
    throw new ApiError(404, "Public form not found.");
  }

  return form;
};

const getBaseUrl = () => {
  const baseUrl = env.publicFormBaseUrl || env.publicBaseUrl || env.appBaseUrl || "";

  return String(baseUrl).replace(/\/+$/, "");
};

const buildPublicUrl = (businessId, slug) => {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    throw new ApiError(500, "Public form base URL is not configured.");
  }

  return `${baseUrl}/public/forms/${businessId}/${slug}`;
};

const normalizeName = (value, form) => {
  const name = String(value || "").trim();

  if (name) {
    return name.slice(0, 150);
  }

  return `${form.name} QR`.slice(0, 150);
};

const generatePng = async ({ publicUrl, size, margin, errorCorrectionLevel }) => {
  return QRCode.toDataURL(publicUrl, {
    type: "image/png",
    width: size,
    margin,
    errorCorrectionLevel,
  });
};

const generateSvg = async ({ publicUrl, margin, errorCorrectionLevel }) => {
  return QRCode.toString(publicUrl, {
    type: "svg",
    margin,
    errorCorrectionLevel,
  });
};

const generateQrImage = async ({ publicUrl, size, margin, errorCorrectionLevel, format }) => {
  if (format === "svg") {
    return generateSvg({
      publicUrl,
      margin,
      errorCorrectionLevel,
    });
  }

  return generatePng({
    publicUrl,
    size,
    margin,
    errorCorrectionLevel,
  });
};

exports.list = async ({ businessId, userId, formId, active, search }) => {
  await ensureBusiness(businessId, userId);

  const filter = {
    businessId,
  };

  if (formId) {
    if (!validId(formId)) {
      throw new ApiError(400, "Invalid form ID.");
    }

    filter.formId = formId;
  }

  if (active !== undefined) {
    filter.active = String(active) !== "false";
  }

  if (search) {
    filter.name = {
      $regex: String(search).trim(),
      $options: "i",
    };
  }

  return FormQrCode.find(filter).populate("formId", "name slug status").sort({ createdAt: -1 }).lean();
};

exports.getById = async ({ businessId, userId, qrId }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(qrId)) {
    throw new ApiError(400, "Invalid QR ID.");
  }

  const qr = await FormQrCode.findOne({
    _id: qrId,
    businessId,
  })
    .populate("formId", "name slug status")
    .lean();

  if (!qr) {
    throw new ApiError(404, "QR code not found.");
  }

  return qr;
};

exports.create = async ({ businessId, userId, data }) => {
  await ensureBusiness(businessId, userId);

  const form = await getForm(businessId, data.formId);

  const publicUrl = buildPublicUrl(businessId, form.slug);

  const qrData = {
    businessId,
    formId: form._id,
    name: normalizeName(data.name, form),
    slug: form.slug,
    publicUrl,
    size: Number(data.size || 400),
    margin: Number(data.margin !== undefined ? data.margin : 2),
    errorCorrectionLevel: data.errorCorrectionLevel || "M",
    format: data.format || "png",
    active: data.active !== false,
    metadata: data.metadata || {},
    createdBy: userId,
    updatedBy: userId,
  };

  const created = await FormQrCode.create(qrData);

  const image = await generateQrImage({
    publicUrl,
    size: created.size,
    margin: created.margin,
    errorCorrectionLevel: created.errorCorrectionLevel,
    format: created.format,
  });

  return {
    ...created.toObject(),
    qrImage: image,
  };
};

exports.update = async ({ businessId, userId, qrId, data }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(qrId)) {
    throw new ApiError(400, "Invalid QR ID.");
  }

  const qr = await FormQrCode.findOne({
    _id: qrId,
    businessId,
  });

  if (!qr) {
    throw new ApiError(404, "QR code not found.");
  }

  if (data.name !== undefined) {
    qr.name = String(data.name).trim();
  }

  if (data.size !== undefined) {
    qr.size = Number(data.size);
  }

  if (data.margin !== undefined) {
    qr.margin = Number(data.margin);
  }

  if (data.errorCorrectionLevel !== undefined) {
    qr.errorCorrectionLevel = data.errorCorrectionLevel;
  }

  if (data.format !== undefined) {
    qr.format = data.format;
  }

  if (data.active !== undefined) {
    qr.active = Boolean(data.active);
  }

  if (data.metadata !== undefined) {
    qr.metadata = data.metadata;
  }

  qr.updatedBy = userId;

  await qr.save();

  const image = await generateQrImage({
    publicUrl: qr.publicUrl,
    size: qr.size,
    margin: qr.margin,
    errorCorrectionLevel: qr.errorCorrectionLevel,
    format: qr.format,
  });

  return {
    ...qr.toObject(),
    qrImage: image,
  };
};

exports.remove = async ({ businessId, userId, qrId }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(qrId)) {
    throw new ApiError(400, "Invalid QR ID.");
  }

  const qr = await FormQrCode.findOneAndDelete({
    _id: qrId,
    businessId,
  });

  if (!qr) {
    throw new ApiError(404, "QR code not found.");
  }

  return qr;
};

exports.regenerate = async ({ businessId, userId, qrId, data }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(qrId)) {
    throw new ApiError(400, "Invalid QR ID.");
  }

  const qr = await FormQrCode.findOne({
    _id: qrId,
    businessId,
  });

  if (!qr) {
    throw new ApiError(404, "QR code not found.");
  }

  if (data.size !== undefined) {
    qr.size = Number(data.size);
  }

  if (data.margin !== undefined) {
    qr.margin = Number(data.margin);
  }

  if (data.errorCorrectionLevel !== undefined) {
    qr.errorCorrectionLevel = data.errorCorrectionLevel;
  }

  if (data.format !== undefined) {
    qr.format = data.format;
  }

  qr.updatedBy = userId;

  await qr.save();

  const image = await generateQrImage({
    publicUrl: qr.publicUrl,
    size: qr.size,
    margin: qr.margin,
    errorCorrectionLevel: qr.errorCorrectionLevel,
    format: qr.format,
  });

  return {
    ...qr.toObject(),
    qrImage: image,
  };
};

exports.getImage = async ({ businessId, userId, qrId }) => {
  await ensureBusiness(businessId, userId);

  if (!validId(qrId)) {
    throw new ApiError(400, "Invalid QR ID.");
  }

  const qr = await FormQrCode.findOne({
    _id: qrId,
    businessId,
  }).lean();

  if (!qr) {
    throw new ApiError(404, "QR code not found.");
  }

  if (!qr.active) {
    throw new ApiError(400, "This QR code is inactive.");
  }

  return generateQrImage({
    publicUrl: qr.publicUrl,
    size: qr.size,
    margin: qr.margin,
    errorCorrectionLevel: qr.errorCorrectionLevel,
    format: qr.format,
  });
};

exports.recordScan = async ({ businessId, qrId }) => {
  if (!validId(businessId) || !validId(qrId)) {
    return null;
  }

  return FormQrCode.findOneAndUpdate(
    {
      _id: qrId,
      businessId,
      active: true,
    },
    {
      $inc: {
        scanCount: 1,
      },
      $set: {
        lastScannedAt: new Date(),
      },
    },
    {
      new: true,
    }
  ).lean();
};
