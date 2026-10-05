const mongoose = require("mongoose");

const ApiError = require("../../utils/ApiError");
const Tag = require("./tag.model");

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

const generateUniqueSlug = async (businessId, name, excludeTagId = null) => {
  const baseSlug = normalizeSlug(name);

  if (!baseSlug) {
    throw new ApiError(400, "Tag name must contain valid characters.");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter = {
      businessId,
      slug,
    };

    if (excludeTagId) {
      filter._id = { $ne: excludeTagId };
    }

    const existingTag = await Tag.findOne(filter).select("_id").lean();

    if (!existingTag) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

const getTagById = async (tagId, businessId) => {
  validateObjectId(tagId, "tag ID");
  validateObjectId(businessId, "business ID");

  const tag = await Tag.findOne({
    _id: tagId,
    businessId,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!tag) {
    throw new ApiError(404, "Tag not found.");
  }

  return tag;
};

const createTag = async ({ businessId, name, description, color, type, createdBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(createdBy, "creator ID");

  const normalizedName = name.trim();

  const existingTag = await Tag.findOne({
    businessId,
    name: {
      $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  })
    .select("_id")
    .lean();

  if (existingTag) {
    throw new ApiError(409, "A tag with this name already exists in this business.");
  }

  const slug = await generateUniqueSlug(businessId, normalizedName);

  const tag = await Tag.create({
    businessId,
    name: normalizedName,
    slug,
    description: description || null,
    color: color || null,
    type: type || "CUSTOM",
    createdBy,
  });

  return getTagById(tag._id, businessId);
};

const getTagsByBusiness = async (businessId, { page = 1, limit = 50, search, type, includeInactive = false } = {}) => {
  validateObjectId(businessId, "business ID");

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const filter = {
    businessId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  if (type) {
    filter.type = type;
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
        description: {
          $regex: searchText,
          $options: "i",
        },
      },
    ];
  }

  const skip = (currentPage - 1) * currentLimit;

  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        name: 1,
      })
      .skip(skip)
      .limit(currentLimit),

    Tag.countDocuments(filter),
  ]);

  return {
    tags,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

const updateTag = async (tagId, businessId, updates, updatedBy) => {
  validateObjectId(tagId, "tag ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const tag = await Tag.findOne({
    _id: tagId,
    businessId,
  });

  if (!tag) {
    throw new ApiError(404, "Tag not found.");
  }

  if (tag.type === "SYSTEM") {
    throw new ApiError(403, "System tags cannot be modified.");
  }

  if (updates.name !== undefined) {
    const normalizedName = updates.name.trim();

    const duplicateTag = await Tag.findOne({
      businessId,
      _id: { $ne: tagId },
      name: {
        $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    })
      .select("_id")
      .lean();

    if (duplicateTag) {
      throw new ApiError(409, "A tag with this name already exists in this business.");
    }

    tag.name = normalizedName;

    tag.slug = await generateUniqueSlug(businessId, normalizedName, tagId);
  }

  if (updates.description !== undefined) {
    tag.description = updates.description || null;
  }

  if (updates.color !== undefined) {
    tag.color = updates.color || null;
  }

  if (updates.isActive !== undefined) {
    tag.isActive = updates.isActive;
  }

  tag.updatedBy = updatedBy;

  await tag.save();

  return getTagById(tag._id, businessId);
};

const deleteTag = async (tagId, businessId, deletedBy) => {
  validateObjectId(tagId, "tag ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(deletedBy, "deleter ID");

  const tag = await Tag.findOne({
    _id: tagId,
    businessId,
  });

  if (!tag) {
    throw new ApiError(404, "Tag not found.");
  }

  if (tag.type === "SYSTEM") {
    throw new ApiError(403, "System tags cannot be deleted.");
  }

  tag.isActive = false;
  tag.updatedBy = deletedBy;

  await tag.save();

  return tag;
};

const restoreTag = async (tagId, businessId, updatedBy) => {
  validateObjectId(tagId, "tag ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(updatedBy, "updater ID");

  const tag = await Tag.findOne({
    _id: tagId,
    businessId,
  });

  if (!tag) {
    throw new ApiError(404, "Tag not found.");
  }

  tag.isActive = true;
  tag.updatedBy = updatedBy;

  await tag.save();

  return getTagById(tag._id, businessId);
};

module.exports = {
  validateObjectId,
  normalizeSlug,
  generateUniqueSlug,
  getTagById,
  createTag,
  getTagsByBusiness,
  updateTag,
  deleteTag,
  restoreTag,
};
