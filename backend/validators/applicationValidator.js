const { APPLICATION_STATUS } = require("../utils/statusConstants");

function validateApply(req) {
    const errors = [];
    const { drive_id } = req.body || {};

    if (!drive_id || typeof drive_id !== "string" || !drive_id.trim()) {
        errors.push("drive_id is required.");
    }

    const { resume } = req.body || {};
    if (resume !== undefined && resume !== null && typeof resume !== "string") {
        errors.push("resume must be a valid string or URL if provided.");
    }

    return errors;
}

function validateStatusUpdate(req) {
    const errors = [];
    const { status } = req.body || {};

    if (!status || !Object.values(APPLICATION_STATUS).includes(status)) {
        errors.push(`Status must be one of: ${Object.values(APPLICATION_STATUS).join(", ")}`);
    }

    return errors;
}

module.exports = {
    validateApply,
    validateStatusUpdate
};
