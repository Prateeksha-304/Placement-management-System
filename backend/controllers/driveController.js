const driveService = require("../services/driveService");
const { successResponse } = require("../utils/apiResponse");

const driveController = {
    async getAll(req, res) {
        const drives = await driveService.getAllDrives();
        if (req.query.format === "wrapped") {
            return successResponse(res, "Placement drives retrieved", drives, 200);
        }
        return res.status(200).json(drives);
    },

    async getById(req, res) {
        const drive = await driveService.getDriveById(req.params.id);
        return successResponse(res, "Placement drive retrieved", drive, 200);
    },

    async create(req, res) {
        const { criteria, ...driveData } = req.body;
        const created = await driveService.createDrive(driveData, criteria || req.body);
        return successResponse(res, "Placement drive created successfully", created, 201);
    },

    async update(req, res) {
        const { criteria, ...driveData } = req.body;
        const updated = await driveService.updateDrive(req.params.id, driveData, criteria);
        return successResponse(res, "Placement drive updated successfully", updated, 200);
    },

    async delete(req, res) {
        await driveService.deleteDrive(req.params.id);
        return successResponse(res, "Placement drive deleted successfully", {}, 200);
    }
};

module.exports = driveController;
