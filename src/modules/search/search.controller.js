const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const service = require("./search.service");

const search = asyncHandler(async (req, res) => {
  const data = await service.searchBusiness({
    businessId: req.params.businessId,
    q: req.query.q,
    type: req.query.type,
    limit: req.query.limit,
  });
  return ApiResponse.success(res, data, "Search completed successfully.");
});

module.exports = { search };
