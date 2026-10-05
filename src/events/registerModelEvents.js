const { publish } = require("./eventBus");
const { getAutomationContext } = require("./automationContext");

const registerModelEvents = (schema, entity) => {
  /*
   * ============================================================
   * PRE SAVE
   * ============================================================
   * Capture the previous document before an existing document is
   * saved so automation events can compare old vs new values.
   *
   * IMPORTANT:
   * This is an async middleware, so we intentionally do NOT use
   * next(). Mongoose waits for the promise to resolve.
   */
  schema.pre("save", async function () {
    if (this.isNew) {
      this.__automationBefore = null;
      return;
    }

    try {
      this.__automationBefore = await this.constructor.findById(this._id).lean();
    } catch (_) {
      this.__automationBefore = null;
    }
  });

  /*
   * ============================================================
   * POST SAVE
   * ============================================================
   */
  schema.post("save", function (doc) {
    Promise.resolve()
      .then(async () => {
        const before = doc.__automationBefore;

        delete doc.__automationBefore;

        const record = doc.toObject ? doc.toObject() : doc;

        const context = getAutomationContext();

        const payload = {
          businessId: record.businessId,
          entity: entity.toUpperCase(),
          entityId: record._id.toString(),
          record,
          actorId: record.updatedBy || record.createdBy || null,
          automationId: context?.automationId || null,
          automationDepth: context?.depth || 0,
        };

        /*
         * New document
         */
        if (!before) {
          await publish(`${entity}.created`, payload);
          return;
        }

        /*
         * Soft delete detection
         */
        if (record.isActive === false || record.isDeleted === true) {
          await publish(`${entity}.deleted`, {
            ...payload,
            previousRecord: before,
          });

          return;
        }

        /*
         * Normal update
         */
        await publish(`${entity}.updated`, {
          ...payload,
          previousRecord: before,
        });

        /*
         * Status changed
         */
        if (before.status !== record.status && record.status !== undefined) {
          await publish(`${entity}.status_changed`, {
            ...payload,
            previousRecord: before,
          });
        }

        /*
         * Stage changed
         */
        if (before.stageId?.toString?.() !== record.stageId?.toString?.() && record.stageId !== undefined) {
          await publish(`${entity}.stage_changed`, {
            ...payload,
            previousRecord: before,
          });
        }

        /*
         * Assignment changed
         */
        if (before.assignedTo?.toString?.() !== record.assignedTo?.toString?.() || before.assignedTeamId?.toString?.() !== record.assignedTeamId?.toString?.()) {
          await publish(`${entity}.assigned`, {
            ...payload,
            previousRecord: before,
          });
        }
      })
      .catch((error) => {
        console.error(`Model automation event error (${entity}):`, error.message);
      });
  });

  /*
   * ============================================================
   * FIND ONE AND DELETE
   * ============================================================
   */
  schema.post("findOneAndDelete", function (doc) {
    if (!doc) return;

    Promise.resolve(
      publish(`${entity}.deleted`, {
        businessId: doc.businessId,
        entity: entity.toUpperCase(),
        entityId: doc._id.toString(),
        record: doc.toObject ? doc.toObject() : doc,
        actorId: doc.updatedBy || doc.createdBy || null,
      })
    ).catch((error) => {
      console.error(`Model delete event error (${entity}):`, error.message);
    });
  });
};

module.exports = registerModelEvents;
