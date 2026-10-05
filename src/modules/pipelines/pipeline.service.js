const Pipeline = require("./pipeline.model");
const Business = require("../businesses/business.model");

const ApiError = require("../../utils/ApiError");

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id.toString())) {
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

const generateUniqueSlug = async (businessId, name, excludeId = null) => {
  const baseSlug = normalizeSlug(name) || "pipeline";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter = {
      businessId,
      slug,
    };

    if (excludeId) {
      filter._id = {
        $ne: excludeId,
      };
    }

    const exists = await Pipeline.exists(filter);

    if (!exists) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

const getBusiness = async (businessId) => {
  validateObjectId(businessId, "business ID");

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  return business;
};

const normalizeStages = (stages = []) => {
  if (!Array.isArray(stages)) {
    return [];
  }

  const usedSlugs = new Set();

  return stages.map((stage, index) => {
    const name = stage.name.toString().trim();

    if (!name) {
      throw new ApiError(400, `Stage name is required at position ${index + 1}.`);
    }

    const baseSlug = normalizeSlug(name) || `stage-${index + 1}`;

    let slug = baseSlug;
    let counter = 1;

    while (usedSlugs.has(slug)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    usedSlugs.add(slug);

    return {
      name,
      slug,
      description: stage.description || null,
      order: index,
      probability: stage.probability !== undefined ? Number(stage.probability) : 0,
      color: stage.color || null,
      isClosed: Boolean(stage.isClosed),
      isWon: Boolean(stage.isWon),
      isActive: stage.isActive !== undefined ? Boolean(stage.isActive) : true,
    };
  });
};

const createPipeline = async ({ businessId, name, description, type, stages, isDefault, status, createdBy }) => {
  await getBusiness(businessId);

  validateObjectId(createdBy, "created by user ID");

  const slug = await generateUniqueSlug(businessId, name);

  const normalizedStages = normalizeStages(stages);

  let shouldBeDefault = Boolean(isDefault);

  if (!shouldBeDefault) {
    const existingDefault = await Pipeline.exists({
      businessId,
      isDefault: true,
      status: "ACTIVE",
    });

    if (!existingDefault) {
      shouldBeDefault = true;
    }
  }

  if (shouldBeDefault) {
    await Pipeline.updateMany(
      {
        businessId,
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      }
    );
  }

  const pipeline = await Pipeline.create({
    businessId,
    name,
    slug,
    description: description || null,
    type: type || "SALES",
    stages: normalizedStages,
    isDefault: shouldBeDefault,
    status: status || "ACTIVE",
    createdBy,
  });

  return getPipelineByIdForBusiness(pipeline._id, businessId);
};

const getPipelinesByBusiness = async (businessId, { page = 1, limit = 10, search, type, status, includeInactive = false } = {}) => {
  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

  if (!includeInactive && !status) {
    filter.status = "ACTIVE";
  }

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (search) {
    const searchValue = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [pipelines, total] = await Promise.all([
    Pipeline.find(filter)
      .sort({
        isDefault: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Pipeline.countDocuments(filter),
  ]);

  return {
    pipelines,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPipelineById = async (pipelineId) => {
  validateObjectId(pipelineId, "pipeline ID");

  const pipeline = await Pipeline.findById(pipelineId).populate("createdBy", "name email").populate("updatedBy", "name email").lean();

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  return pipeline;
};

const getPipelineByIdForBusiness = async (pipelineId, businessId) => {
  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(businessId, "business ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  return pipeline;
};

const updatePipeline = async (pipelineId, businessId, updates, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(updatedBy, "updated by user ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  });

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  if (updates.name !== undefined) {
    const newName = updates.name.toString().trim();

    if (newName.toLowerCase() !== pipeline.name.toLowerCase()) {
      pipeline.slug = await generateUniqueSlug(businessId, newName, pipelineId);
    }

    pipeline.name = newName;
  }

  if (updates.description !== undefined) {
    pipeline.description = updates.description || null;
  }

  if (updates.type !== undefined) {
    pipeline.type = updates.type;
  }

  if (updates.status !== undefined) {
    pipeline.status = updates.status;
  }

  if (updates.stages !== undefined) {
    pipeline.stages = normalizeStages(updates.stages);
  }

  if (updates.isDefault !== undefined) {
    if (updates.isDefault) {
      await Pipeline.updateMany(
        {
          businessId,
          _id: {
            $ne: pipelineId,
          },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      pipeline.isDefault = true;
    } else {
      pipeline.isDefault = false;
    }
  }

  pipeline.updatedBy = updatedBy;

  await pipeline.save();

  if (pipeline.status === "INACTIVE" && pipeline.isDefault) {
    pipeline.isDefault = false;
    await pipeline.save();
  }

  const activeDefault = await Pipeline.exists({
    businessId,
    status: "ACTIVE",
    isDefault: true,
  });

  if (!activeDefault) {
    const fallback = await Pipeline.findOne({
      businessId,
      status: "ACTIVE",
      _id: {
        $ne: pipelineId,
      },
    }).sort({
      createdAt: 1,
    });

    if (fallback) {
      fallback.isDefault = true;
      fallback.updatedBy = updatedBy;
      await fallback.save();
    }
  }

  return getPipelineByIdForBusiness(pipelineId, businessId);
};

const addStage = async (pipelineId, businessId, stageData, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(updatedBy, "updated by user ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  });

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  const name = stageData.name.toString().trim();

  if (!name) {
    throw new ApiError(400, "Stage name is required.");
  }

  const baseSlug = normalizeSlug(name) || `stage-${pipeline.stages.length + 1}`;

  let slug = baseSlug;
  let counter = 1;

  while (pipeline.stages.some((stage) => stage.slug === slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const nextOrder = pipeline.stages.length;

  pipeline.stages.push({
    name,
    slug,
    description: stageData.description || null,
    order: stageData.order !== undefined ? Number(stageData.order) : nextOrder,
    probability: stageData.probability !== undefined ? Number(stageData.probability) : 0,
    color: stageData.color || null,
    isClosed: Boolean(stageData.isClosed),
    isWon: Boolean(stageData.isWon),
    isActive: stageData.isActive !== undefined ? Boolean(stageData.isActive) : true,
  });

  pipeline.stages.sort((a, b) => a.order - b.order);

  pipeline.stages.forEach((stage, index) => {
    stage.order = index;
  });

  pipeline.updatedBy = updatedBy;

  await pipeline.save();

  return getPipelineByIdForBusiness(pipelineId, businessId);
};

const updateStage = async (pipelineId, businessId, stageId, updates, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(stageId, "stage ID");

  validateObjectId(updatedBy, "updated by user ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  });

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  const stage = pipeline.stages.id(stageId);

  if (!stage) {
    throw new ApiError(404, "Pipeline stage not found.");
  }

  if (updates.name !== undefined) {
    const newName = updates.name.toString().trim();

    if (newName.toLowerCase() !== stage.name.toLowerCase()) {
      const baseSlug = normalizeSlug(newName) || "stage";

      let slug = baseSlug;
      let counter = 1;

      while (pipeline.stages.some((item) => item._id.toString() !== stageId && item.slug === slug)) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }

      stage.slug = slug;
    }

    stage.name = newName;
  }

  if (updates.description !== undefined) {
    stage.description = updates.description || null;
  }

  if (updates.probability !== undefined) {
    stage.probability = Number(updates.probability);
  }

  if (updates.color !== undefined) {
    stage.color = updates.color || null;
  }

  if (updates.isClosed !== undefined) {
    stage.isClosed = Boolean(updates.isClosed);
  }

  if (updates.isWon !== undefined) {
    stage.isWon = Boolean(updates.isWon);

    if (stage.isWon) {
      stage.isClosed = true;
    }
  }

  if (updates.isActive !== undefined) {
    stage.isActive = Boolean(updates.isActive);
  }

  if (updates.order !== undefined) {
    stage.order = Number(updates.order);
  }

  pipeline.stages.sort((a, b) => a.order - b.order);

  pipeline.stages.forEach((item, index) => {
    item.order = index;
  });

  pipeline.updatedBy = updatedBy;

  await pipeline.save();

  return getPipelineByIdForBusiness(pipelineId, businessId);
};

const deleteStage = async (pipelineId, businessId, stageId, updatedBy) => {
  await getBusiness(businessId);

  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(stageId, "stage ID");

  validateObjectId(updatedBy, "updated by user ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  });

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  const stage = pipeline.stages.id(stageId);

  if (!stage) {
    throw new ApiError(404, "Pipeline stage not found.");
  }

  pipeline.stages.pull(stageId);

  pipeline.stages.forEach((item, index) => {
    item.order = index;
  });

  pipeline.updatedBy = updatedBy;

  await pipeline.save();

  return getPipelineByIdForBusiness(pipelineId, businessId);
};

const deletePipeline = async (pipelineId, businessId, deletedBy) => {
  await getBusiness(businessId);

  validateObjectId(pipelineId, "pipeline ID");

  validateObjectId(deletedBy, "deleted by user ID");

  const pipeline = await Pipeline.findOne({
    _id: pipelineId,
    businessId,
  });

  if (!pipeline) {
    throw new ApiError(404, "Pipeline not found.");
  }

  if (pipeline.isDefault) {
    const replacement = await Pipeline.findOne({
      businessId,
      status: "ACTIVE",
      _id: {
        $ne: pipelineId,
      },
    }).sort({
      createdAt: 1,
    });

    if (!replacement) {
      throw new ApiError(409, "The default pipeline cannot be deactivated because this business has no other active pipeline.");
    }

    replacement.isDefault = true;
    replacement.updatedBy = deletedBy;

    await replacement.save();
  }

  pipeline.status = "INACTIVE";
  pipeline.isDefault = false;
  pipeline.updatedBy = deletedBy;

  await pipeline.save();

  return getPipelineByIdForBusiness(pipelineId, businessId);
};

module.exports = {
  createPipeline,
  getPipelinesByBusiness,
  getPipelineById,
  getPipelineByIdForBusiness,
  updatePipeline,
  addStage,
  updateStage,
  deleteStage,
  deletePipeline,
};
