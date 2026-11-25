const { errorResponse } = require("../utils/apiResponse");

function validateRequest(validatorFn) {
    return (req, res, next) => {
        const errors = validatorFn(req);
        if (errors && errors.length > 0) {
            return errorResponse(res, "Validation failed", errors, 422);
        }
        next();
    };
}

module.exports = validateRequest;
