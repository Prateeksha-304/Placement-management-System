const { errorResponse } = require("../utils/apiResponse");
const { FRONTEND_ROLE_MAP } = require("../utils/statusConstants");

/**
 * Middleware to restrict access based on user role
 * @param  {...string} allowedRoles Allowed role names (e.g. 'student', 'placement_officer', 'placement_coordinator')
 */
function authorizeRole(...allowedRoles) {
    const normalizedAllowed = allowedRoles.map(r => FRONTEND_ROLE_MAP[r] || r);

    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required.", "Unauthenticated", 401);
        }

        const userRole = FRONTEND_ROLE_MAP[req.user.role] || req.user.role;

        if (!normalizedAllowed.includes(userRole)) {
            return errorResponse(
                res,
                `Forbidden. You do not have permission to access this resource.`,
                `Role '${req.user.role}' not authorized.`,
                403
            );
        }

        next();
    };
}

module.exports = authorizeRole;
