const studentService = require("../services/studentService");
const { successResponse } = require("../utils/apiResponse");

const studentController = {
    async getMyProfile(req, res) {
        const usn = req.user.usn;
        if (!usn) {
            const err = new Error("No USN associated with this student account.");
            err.statusCode = 400;
            throw err;
        }

        const profile = await studentService.getProfile(usn);
        return successResponse(res, "Student profile retrieved", profile, 200);
    },

    async getStudentByUsn(req, res) {
        const usn = req.params.usn;
        const profile = await studentService.getProfile(usn);
        return successResponse(res, "Student details retrieved", profile, 200);
    },

    async getAllStudents(req, res) {
        const students = await studentService.getAllStudents();
        return successResponse(res, "Students list retrieved", students, 200);
    },

    async getPlacementStatus(req, res) {
        const usn = req.params.usn || req.user.usn;
        if (!usn) {
            const err = new Error("No USN specified or associated with this account.");
            err.statusCode = 400;
            throw err;
        }

        const statusInfo = await studentService.getPlacementStatus(usn);
        return successResponse(res, "Student placement status retrieved", statusInfo, 200);
    }
};

module.exports = studentController;
