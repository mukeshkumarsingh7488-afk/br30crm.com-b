const { publish } = require("./eventBus");
const { getAutomationContext } = require("./automationContext");
const { getRequestContext } = require("./requestContext");

const toId = (value) => {
  if (!value) return null;
  return typeof value === "string" ? value : value.toString?.() || null;
};

const getUpdateActor = (query, requestContext) => {
  const update = query?.getUpdate?.() || {};
  return toId(update?.updatedBy || update?.$set?.updatedBy || update?.$setOnInsert?.updatedBy || update?.createdBy || update?.$set?.createdBy || update?.$setOnInsert?.createdBy || requestContext?.userId);
};

const buildPayload = ({ entity, record, before = null, actorId = null, automationContext = null }) => ({
  businessId: record?.businessId,
  entity: entity.toUpperCase(),
  entityId: record?._id?.toString?.() || null,
  record,
  previousRecord: before,
  actorId: actorId || null,
  automationId: automationContext?.automationId || null,
  automationDepth: automationContext?.depth || 0,
});

const emitRecordEvents = async ({ entity, record, before = null, actorId = null, automationContext = null }) => {
  if (!record?.businessId || !record?._id) return;

  const base = buildPayload({ entity, record, before, actorId, automationContext });

  if (!before) {
    await publish(`${entity}.created`, base);
    return;
  }

  if (record.isActive === false || record.isDeleted === true) {
    await publish(`${entity}.deleted`, base);
    return;
  }

  const statusChanged = before.status !== record.status && record.status !== undefined;
  const stageChanged = before.stageId?.toString?.() !== record.stageId?.toString?.() && record.stageId !== undefined;
  const assignmentChanged = before.assignedTo?.toString?.() !== record.assignedTo?.toString?.() || before.assignedTeamId?.toString?.() !== record.assignedTeamId?.toString?.();

  const changeFlags = { statusChanged, stageChanged, assignmentChanged };

  await publish(`${entity}.updated`, { ...base, changeFlags });

  if (statusChanged) await publish(`${entity}.status_changed`, { ...base, changeFlags });
  if (stageChanged) await publish(`${entity}.stage_changed`, { ...base, changeFlags });
  if (assignmentChanged) await publish(`${entity}.assigned`, { ...base, changeFlags });
};

const registerModelEvents = (schema, entity) => {
  schema.pre("save", async function () {
    if (this.isNew) {
      this.__eventBefore = null;
      return;
    }

    try {
      this.__eventBefore = await this.constructor.findById(this._id).lean();
    } catch (_) {
      this.__eventBefore = null;
    }
  });

  schema.post("save", function (doc) {
    Promise.resolve()
      .then(async () => {
        const before = doc.__eventBefore;
        delete doc.__eventBefore;

        const record = doc.toObject ? doc.toObject() : doc;
        const automationContext = getAutomationContext();
        const requestContext = getRequestContext();
        const actorId = toId(record.updatedBy || record.createdBy || requestContext?.userId || null);

        await emitRecordEvents({
          entity,
          record,
          before,
          actorId,
          automationContext,
        });
      })
      .catch((error) => {});
  });

  const captureQueryBefore = async function () {
    try {
      const query = this.getQuery();
      this.__eventBefore = await this.model.findOne(query).lean();
    } catch (_) {
      this.__eventBefore = null;
    }
  };

  const publishQueryAfter = function () {
    Promise.resolve()
      .then(async () => {
        if (!this.__eventBefore) return;

        const query = this.getQuery();
        const record = await this.model.findOne({ _id: this.__eventBefore._id }).lean();
        if (!record) return;

        const automationContext = getAutomationContext();
        const requestContext = getRequestContext();
        const actorId = getUpdateActor(this, requestContext) || toId(record.updatedBy || record.createdBy || null);

        await emitRecordEvents({
          entity,
          record,
          before: this.__eventBefore,
          actorId,
          automationContext,
        });
      })
      .catch((error) => {});
  };

  schema.pre("findOneAndUpdate", captureQueryBefore);
  schema.post("findOneAndUpdate", publishQueryAfter);
  schema.pre("updateOne", captureQueryBefore);
  schema.post("updateOne", publishQueryAfter);

  schema.post("findOneAndDelete", function (doc) {
    if (!doc) return;

    Promise.resolve()
      .then(async () => {
        const requestContext = getRequestContext();
        const record = doc.toObject ? doc.toObject() : doc;
        const actorId = toId(record.deletedBy || record.updatedBy || record.createdBy || requestContext?.userId || null);
        const automationContext = getAutomationContext();

        await publish(`${entity}.deleted`, buildPayload({ entity, record, before: record, actorId, automationContext }));
      })
      .catch((error) => {});
  });
};

module.exports = registerModelEvents;
