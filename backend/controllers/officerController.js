const reportService = require("../services/reportService");
const { successResponse } = require("../utils/apiResponse");

const officerController = {
    async getDashboard(req, res) {
        const stats = await reportService.getOfficerDashboardStats();
        return successResponse(res, "Officer dashboard metrics retrieved", stats, 200);
    }
};

module.exports = officerController;
