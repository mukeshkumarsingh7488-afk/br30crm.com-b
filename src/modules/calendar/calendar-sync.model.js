const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarAccount", required: true, index: true },
    direction: { type: String, enum: ["PULL", "PUSH", "BIDIRECTIONAL"], default: "BIDIRECTIONAL" },
    status: { type: String, enum: ["IDLE", "RUNNING", "COMPLETED", "FAILED"], default: "IDLE", index: true },
    cursor: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);
schema.index({ accountId: 1 }, { unique: true });
module.exports = mongoose.model("CalendarSync", schema);
