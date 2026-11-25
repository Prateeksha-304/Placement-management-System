const authService = require("../services/authService");
const { successResponse } = require("../utils/apiResponse");

const authController = {
    async login(req, res) {
        const { email, password, role } = req.body;
        const result = await authService.login(email, password, role);
        return successResponse(res, "Login successful", result, 200);
    },

    async logout(req, res) {
        return successResponse(res, "Logged out successfully", {}, 200);
    },

    async getMe(req, res) {
        const result = await authService.getMe(req.user);
        return successResponse(res, "Profile retrieved successfully", result, 200);
    }
};

module.exports = authController;
