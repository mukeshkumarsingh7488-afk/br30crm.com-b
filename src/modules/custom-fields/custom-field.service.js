const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const CustomField = require("./custom-field.model");

const ALLOWED_ENTITIES = ["LEAD", "CONTACT", "COMPANY", "DEAL", "ACTIVITY", "TASK", "NOTE"];

const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME", "EMAIL", "PHONE", "URL", "SELECT", "MULTI_SELECT"];

const SELECT_FIELD_TYPES = ["SELECT", "MULTI_SELECT"];

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const normalizeSlug = (value) => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (businessId, entity, name, excludeFieldId = null) => {
  const baseSlug = normalizeSlug(name);

  if (!baseSlug) {
    throw new ApiError(400, "Custom field name must contain valid characters.");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter = {
      businessId,
      entity,
      slug,
    };

    if (excludeFieldId) {
      filter._id = { $ne: excludeFieldId };
    }

    const existingField = await CustomField.findOne(filter).select("_id").lean();

    if (!existingField) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

const getCustomFieldById = async (customFieldId, businessId) => {
  validateObjectId(customFieldId, "custom field ID");
  validateObjectId(businessId, "business ID");

  const customField = await CustomField.findOne({
    _id: customFieldId,
    businessId,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!customField) {
    throw new ApiError(404, "Custom field not found.");
  }

  return customField;
};

const validateOptions = (fieldType, options) => {
  if (!SELECT_FIELD_TYPES.includes(fieldType)) {
    if (options && options.length > 0) {
      throw new ApiError(400, "Options are only allowed for SELECT and MULTI_SELECT fields.");
    }

    return [];
  }

  if (!Array.isArray(options) || options.length === 0) {
    throw new ApiError(400, `${fieldType} field requires at least one option.`);
  }

  const normalizedOptions = options.map((option) => {
    if (!option || typeof option !== "object" || !option.label || !option.value) {
      throw new ApiError(400, "Each custom field option must contain label and value.");
    }

    return {
      label: option.label.toString().trim(),
      value: option.value.toString().trim(),
    };
  });

  const values = normalizedOptions.map((option) => option.value.toLowerCase());

  if (new Set(values).size !== values.length) {
    throw new ApiError(409, "Custom field options must have unique values.");
  }

  return normalizedOptions;
};

const createCustomField = async ({ businessId, name, label, description, entity, fieldType, options, isRequired, sortOrder, placeholder, defaultValue, validation, createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "creator ID");

  if (!ALLOWED_ENTITIES.includes(entity)) {
    throw new ApiError(400, "Invalid custom field entity.");
  }

  if (!FIELD_TYPES.includes(fieldType)) {
    throw new ApiError(400, "Invalid custom field type.");
  }

  const normalizedName = name.trim();

  const existingField = await CustomField.findOne({
    businessId,
    entity,
    name: {
      $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  })
    .select("_id")
    .lean();

  if (existingField) {
    throw new ApiError(409, "A custom field with this name already exists for this entity.");
  }

  const normalizedOptions = validateOptions(fieldType, options);

  const slug = await generateUniqueSlug(businessId, entity, normalizedName);

  const customField = await CustomField.create({
    businessId,
    name: normalizedName,
    slug,
    label: label?.trim() || normalizedName,
    description: description || null,
    entity,
    fieldType,
    options: normalizedOptions,
    isRequired: Boolean(isRequired),
    sortOrder: Number(sortOrder) || 0,
    placeholder: placeholder || null,
    defaultValue: defaultValue !== undefined ? defaultValue : null,
    validation: validation || {},
    createdBy,
  });

  return getCustomFieldById(customField._id, businessId);
};

const getCustomFieldsByBusiness = async (businessId, { entity, search, includeInactive = false, page = 1, limit = 50 } = {}) => {
  validateObjectId(businessId, "business ID");

  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const filter = {
    businessId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  if (entity) {
    if (!ALLOWED_ENTITIES.includes(entity)) {
      throw new ApiError(400, "Invalid custom field entity.");
    }

    filter.entity = entity;
  }

  if (search && search.trim()) {
    const searchText = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        label: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchText,
          $options: "i",
        },
      },
    ];
  }

  const skip = (currentPage - 1) * currentLimit;

  const [customFields, total] = await Promise.all([
    CustomField.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        entity: 1,
        sortOrder: 1,
        name: 1,
      })
      .skip(skip)
      .limit(currentLimit),

    CustomField.countDocuments(filter),
  ]);

  return {
    customFields,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

const getCustomFieldsByEntity = async (businessId, entity, includeInactive = false) => {
  validateObjectId(businessId, "business ID");

  if (!ALLOWED_ENTITIES.includes(entity)) {
    throw new ApiError(400, "Invalid custom field entity.");
  }

  const filter = {
    businessId,
    entity,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  const customFields = await CustomField.find(filter).populate("createdBy", "name email").populate("updatedBy", "name email").sort({
    sortOrder: 1,
    name: 1,
  });

  return customFields;
};

const updateCustomField = async (customFieldId, businessId, updates, updatedBy) => {
  validateObjectId(customFieldId, "custom field ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const customField = await CustomField.findOne({
    _id: customFieldId,
    businessId,
  });

  if (!customField) {
    throw new ApiError(404, "Custom field not found.");
  }

  if (updates.name !== undefined) {
    const normalizedName = updates.name.trim();

    const duplicateField = await CustomField.findOne({
      businessId,
      entity: customField.entity,
      _id: {
        $ne: customFieldId,
      },
      name: {
        $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    })
      .select("_id")
      .lean();

    if (duplicateField) {
      throw new ApiError(409, "A custom field with this name already exists for this entity.");
    }

    customField.name = normalizedName;

    customField.slug = await generateUniqueSlug(businessId, customField.entity, normalizedName, customFieldId);
  }

  if (updates.label !== undefined) {
    customField.label = updates.label.trim() || customField.name;
  }

  if (updates.description !== undefined) {
    customField.description = updates.description || null;
  }

  if (updates.options !== undefined) {
    customField.options = validateOptions(customField.fieldType, updates.options);
  }

  if (updates.isRequired !== undefined) {
    customField.isRequired = updates.isRequired;
  }

  if (updates.sortOrder !== undefined) {
    customField.sortOrder = Number(updates.sortOrder) || 0;
  }

  if (updates.placeholder !== undefined) {
    customField.placeholder = updates.placeholder || null;
  }

  if (updates.defaultValue !== undefined) {
    customField.defaultValue = updates.defaultValue;
  }

  if (updates.validation !== undefined) {
    customField.validation = updates.validation || {};
  }

  if (updates.isActive !== undefined) {
    customField.isActive = updates.isActive;
  }

  customField.updatedBy = updatedBy;

  await customField.save();

  return getCustomFieldById(customField._id, businessId);
};

const deleteCustomField = async (customFieldId, businessId, deletedBy) => {
  validateObjectId(customFieldId, "custom field ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(deletedBy, "deleter ID");

  const customField = await CustomField.findOne({
    _id: customFieldId,
    businessId,
  });

  if (!customField) {
    throw new ApiError(404, "Custom field not found.");
  }

  customField.isActive = false;
  customField.updatedBy = deletedBy;

  await customField.save();

  return customField;
};

const restoreCustomField = async (customFieldId, businessId, updatedBy) => {
  validateObjectId(customFieldId, "custom field ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const customField = await CustomField.findOne({
    _id: customFieldId,
    businessId,
  });

  if (!customField) {
    throw new ApiError(404, "Custom field not found.");
  }

  customField.isActive = true;
  customField.updatedBy = updatedBy;

  await customField.save();

  return getCustomFieldById(customField._id, businessId);
};

module.exports = {
  ALLOWED_ENTITIES,
  FIELD_TYPES,
  SELECT_FIELD_TYPES,
  validateObjectId,
  normalizeSlug,
  generateUniqueSlug,
  getCustomFieldById,
  createCustomField,
  getCustomFieldsByBusiness,
  getCustomFieldsByEntity,
  updateCustomField,
  deleteCustomField,
  restoreCustomField,
};
