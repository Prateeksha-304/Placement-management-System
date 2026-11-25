const { errorResponse } = require("../utils/apiResponse");

function notFoundHandler(req, res) {
    return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, "Not Found", 404);
}

module.exports = notFoundHandler;
