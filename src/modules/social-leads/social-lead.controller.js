const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const service = require("./social-lead.service");

const getConfig = asyncHandler(async (req, res) => ApiResponse.success(res, await service.getConfig(req.params.businessId), "Social lead configuration fetched successfully."));
const rotateSecret = asyncHandler(async (req, res) => ApiResponse.success(res, await service.rotateSecret({ businessId: req.params.businessId, userId: req.user.userId }), "Social webhook secret rotated successfully."));
const ingest = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, message: "Social lead received", data: await service.ingest({ businessId: req.params.businessId, source: req.params.source, payload: req.body, signature: req.get("x-br30-signature"), rawBody: JSON.stringify(req.body) }) })
);
const verify = asyncHandler(async (req, res) => res.status(200).send(req.query["hub.challenge"] || "BR30 CRM webhook"));

module.exports = { getConfig, rotateSecret, ingest, verify };
