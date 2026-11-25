const logger = require("../utils/logger");
const { errorResponse } = require("../utils/apiResponse");

function errorHandler(err, req, res, next) {
    logger.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "An unexpected internal server error occurred.";
    const errorDetails = process.env.NODE_ENV === "production" ? undefined : (err.response?.data || err.details || err.stack);

    return errorResponse(res, message, errorDetails, statusCode);
}

module.exports = errorHandler;
