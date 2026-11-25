const reportService = require("../services/reportService");
const { successResponse } = require("../utils/apiResponse");

const coordinatorController = {
    async getDashboard(req, res) {
        const stats = await reportService.getCoordinatorDashboardStats();
        return successResponse(res, "Coordinator dashboard metrics retrieved", stats, 200);
    },

    async getReports(req, res) {
        const reports = await reportService.getCoordinatorReports();
        return successResponse(res, "Placement analytical reports retrieved", reports, 200);
    },

    async getPlacements(req, res) {
        const placements = await reportService.getCoordinatorPlacements();
        return successResponse(res, "Placed student records retrieved", placements, 200);
    },

    async updatePlacementHistory(req, res) {
        const { id } = req.params;
        const { package_lpa } = req.body;
        const updated = await reportService.updatePlacementPackage(id, package_lpa);
        return successResponse(res, "Placement record package updated successfully", updated, 200);
    }
};

module.exports = coordinatorController;
