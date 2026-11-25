const notificationService = require("../services/notificationService");
const { successResponse } = require("../utils/apiResponse");

const notificationController = {
    async getMyNotifications(req, res) {
        const studentUsn = req.user.usn;
        if (!studentUsn) {
            const err = new Error("No USN associated with this student account.");
            err.statusCode = 400;
            throw err;
        }

        const notifications = await notificationService.getMyNotifications(studentUsn);
        return successResponse(res, "Notifications retrieved", notifications, 200);
    },

    async markRead(req, res) {
        const studentUsn = req.user.role === "student" ? req.user.usn : null;
        const updated = await notificationService.markAsRead(req.params.id, studentUsn);
        return successResponse(res, "Notification marked as read", updated, 200);
    },

    async markAllRead(req, res) {
        const studentUsn = req.user.usn;
        if (!studentUsn) {
            const err = new Error("No USN associated with this student account.");
            err.statusCode = 400;
            throw err;
        }

        const result = await notificationService.markAllAsRead(studentUsn);
        return successResponse(res, "All notifications marked as read", result, 200);
    },

    async broadcastNotice(req, res) {
        const result = await notificationService.broadcastNotice(req.body);
        return successResponse(res, "Notice broadcast successfully", result, 200);
    }
};

module.exports = notificationController;
