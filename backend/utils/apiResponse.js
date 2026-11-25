function successResponse(res, message = "Operation completed successfully", data = {}, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
}

function errorResponse(res, message = "An error occurred", error = null, statusCode = 500) {
    return res.status(statusCode).json({
        success: false,
        message,
        error: error || message
    });
}

module.exports = {
    successResponse,
    errorResponse
};
