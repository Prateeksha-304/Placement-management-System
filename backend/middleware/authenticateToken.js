const { verifyToken } = require("../config/jwt");
const { errorResponse } = require("../utils/apiResponse");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader) {
        return errorResponse(res, "Access denied. No authentication token provided.", "Token missing", 401);
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return errorResponse(res, "Invalid token format. Expected 'Bearer <token>'.", "Malformed token", 401);
    }

    const token = parts[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return errorResponse(res, "Authentication token has expired. Please log in again.", "Token expired", 401);
        }
        return errorResponse(res, "Invalid or unauthorized token.", err.message, 401);
    }
}

module.exports = authenticateToken;
