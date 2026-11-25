const applicationService = require("../services/applicationService");
const { successResponse } = require("../utils/apiResponse");

const applicationController = {
    async apply(req, res) {
        const studentUsn = req.user.usn;
        if (!studentUsn) {
            const err = new Error("No USN associated with this student account.");
            err.statusCode = 400;
            throw err;
        }

        const { drive_id, resume } = req.body;
        const application = await applicationService.apply(studentUsn, drive_id, resume);
        return successResponse(res, "Application submitted successfully", application, 201);
    },

    async getMyApplications(req, res) {
        const studentUsn = req.user.usn;
        if (!studentUsn) {
            const err = new Error("No USN associated with this student account.");
            err.statusCode = 400;
            throw err;
        }

        const applications = await applicationService.getMyApplications(studentUsn);
        return successResponse(res, "Applications retrieved", applications, 200);
    },

    async getAll(req, res) {
        const filters = {
            status: req.query.status,
            usn: req.query.usn,
            drive_id: req.query.drive_id
        };

        const applications = await applicationService.getAllApplications(filters);
        return successResponse(res, "All applications retrieved", applications, 200);
    },

    async getById(req, res) {
        const appId = req.params.id;
        const application = await applicationService.getApplicationById(appId);
        return successResponse(res, "Application details retrieved", application, 200);
    },

    async updateStatus(req, res) {
        const appId = req.params.id;
        const { status } = req.body;
        const changedBy = req.user.name || "Placement Officer";

        const updated = await applicationService.updateStatus(appId, status, changedBy);
        return successResponse(res, `Application status updated to ${status}`, updated, 200);
    }
};

module.exports = applicationController;
