const Setting = require("./setting.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const ApiError = require("../../utils/ApiError");

const validateBusiness = async (businessId) => {
  const business = await Business.findById(businessId).select("_id status");

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  return business;
};

const validateBusinessMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  })
    .populate("roleId", "name type")
    .lean();

  if (!member) {
    throw new ApiError(403, "You are not an active member of this business");
  }

  return member;
};

const getSettings = async (businessId, userId) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  let settings = await Setting.findOne({
    businessId,
  }).lean();

  if (!settings) {
    settings = await Setting.create({
      businessId,
      createdBy: userId,
      updatedBy: userId,
    });

    settings = settings.toObject();
  }

  return settings;
};

const createSettings = async (businessId, userId, data = {}) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const existingSettings = await Setting.findOne({
    businessId,
  });

  if (existingSettings) {
    throw new ApiError(409, "Settings already exist for this business");
  }

  const settings = await Setting.create({
    businessId,
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });

  return settings;
};

const createDefaultSettingsForBusiness = async ({ businessId, userId, business = null }) => {
  const existingSettings = await Setting.findOne({
    businessId,
  });

  if (existingSettings) {
    return existingSettings;
  }

  const businessData = business || (await Business.findById(businessId));

  if (!businessData) {
    throw new ApiError(404, "Business not found");
  }

  const settings = await Setting.create({
    businessId,

    general: {
      businessName: businessData.name || "",
      legalName: businessData.legalName || "",
      description: businessData.description || "",
      website: businessData.website || "",
      logoUrl: businessData.logo || "",
      phone: businessData.phone || "",
      email: businessData.email || "",
      address: businessData.address || {},
    },

    regional: {
      timezone: businessData.timezone || "Asia/Kolkata",
      currency: businessData.currency || "INR",
      dateFormat: businessData.dateFormat || "DD/MM/YYYY",
      timeFormat: businessData.timeFormat || "12h",
      language: "en",
      country: "IN",
    },

    notifications: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      leadNotifications: true,
      dealNotifications: true,
      taskNotifications: true,
      activityNotifications: true,
      automationNotifications: true,
      securityNotifications: true,
    },

    security: {
      sessionTimeoutMinutes: 1440,
      maxLoginAttempts: 5,
      requireStrongPassword: true,
      requireTwoFactor: false,
      allowMultipleSessions: true,
    },

    crm: {
      defaultLeadStatus: "NEW",
      defaultDealStage: "",
      defaultPageSize: 20,
      autoAssignLeads: false,
      autoCreateActivities: false,
    },

    metadata: {},

    createdBy: userId,
    updatedBy: userId,
  });

  return settings;
};

const updateSettings = async (businessId, userId, data = {}) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const settings = await Setting.findOne({
    businessId,
  });

  if (!settings) {
    const createdSettings = await Setting.create({
      businessId,
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return createdSettings;
  }

  const allowedSections = ["general", "regional", "notifications", "security", "crm", "metadata"];

  for (const section of allowedSections) {
    if (Object.prototype.hasOwnProperty.call(data, section) && data[section] !== undefined) {
      if (typeof data[section] === "object" && data[section] !== null && !Array.isArray(data[section])) {
        settings[section] = {
          ...(settings[section]?.toObject ? settings[section].toObject() : settings[section] || {}),
          ...data[section],
        };
      } else {
        settings[section] = data[section];
      }
    }
  }

  settings.updatedBy = userId;

  await settings.save();

  return settings;
};

const resetSettings = async (businessId, userId) => {
  await validateBusiness(businessId);
  await validateBusinessMember(businessId, userId);

  const settings = await Setting.findOne({
    businessId,
  });

  if (!settings) {
    const createdSettings = await createDefaultSettingsForBusiness({
      businessId,
      userId,
    });

    return createdSettings;
  }

  settings.general = {
    businessName: "",
    legalName: "",
    description: "",
    website: "",
    logoUrl: "",
    phone: "",
    email: "",
    address: "",
  };

  settings.regional = {
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    language: "en",
    country: "IN",
  };

  settings.notifications = {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    leadNotifications: true,
    dealNotifications: true,
    taskNotifications: true,
    activityNotifications: true,
    automationNotifications: true,
    securityNotifications: true,
  };

  settings.security = {
    sessionTimeoutMinutes: 1440,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    requireTwoFactor: false,
    allowMultipleSessions: true,
  };

  settings.crm = {
    defaultLeadStatus: "NEW",
    defaultDealStage: "",
    defaultPageSize: 20,
    autoAssignLeads: false,
    autoCreateActivities: false,
  };

  settings.metadata = {};
  settings.updatedBy = userId;

  await settings.save();

  return settings;
};

const removeSettingsForBusiness = async (businessId) => {
  await Setting.deleteMany({
    businessId,
  });
};

module.exports = {
  getSettings,
  createSettings,
  createDefaultSettingsForBusiness,
  updateSettings,
  resetSettings,
  removeSettingsForBusiness,
};
