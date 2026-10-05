const mongoose = require("mongoose");
const registerModelEvents = require("../../events/registerModelEvents");
const reportSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    source: { type: String, enum: ["leads", "contacts", "companies", "deals", "tasks"], required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    columns: { type: [String], default: [] },
    groupBy: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);
reportSchema.index({ businessId: 1, name: 1 });
registerModelEvents(reportSchema, "report");

module.exports = mongoose.model("Report", reportSchema);
