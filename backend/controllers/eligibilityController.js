const eligibilityService = require("../services/eligibilityService");
const { errorResponse } = require("../utils/apiResponse");

const eligibilityController = {
    async getEligibleDrives(req, res) {
        const usn = req.params.usn?.trim();

        // If user is authenticated as student, enforce they only view their own USN
        if (req.user && req.user.role === "student" && req.user.usn && req.user.usn.toLowerCase() !== usn.toLowerCase()) {
            return errorResponse(
                res,
                "Forbidden. Students can only view their own eligible placement drives.",
                "USN mismatch",
                403
            );
        }

        const result = await eligibilityService.getEligibleDrivesForStudent(usn);
        // Return identical response shape to the existing tested endpoint
        return res.status(200).json(result);
    }
};

module.exports = eligibilityController;
