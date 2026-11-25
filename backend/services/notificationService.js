const notificationRepository = require("../repositories/notificationRepository");
const studentRepository = require("../repositories/studentRepository");
const applicationRepository = require("../repositories/applicationRepository");
const eligibilityService = require("./eligibilityService");

const notificationService = {
    async getMyNotifications(studentUsn) {
        return notificationRepository.findByUsn(studentUsn);
    },

    async markAsRead(nId, studentUsn) {
        const notif = await notificationRepository.findById(nId);
        if (!notif) {
            const err = new Error("Notification not found.");
            err.statusCode = 404;
            throw err;
        }

        // Verify notification belongs to this student
        if (studentUsn && notif.usn !== studentUsn) {
            const err = new Error("Unauthorized access to notification.");
            err.statusCode = 403;
            throw err;
        }

        return notificationRepository.markRead(nId);
    },

    async markAllAsRead(studentUsn) {
        return notificationRepository.markAllReadForUsn(studentUsn);
    },

    /**
     * Officer broadcasts notices to target student audience
     */
    async broadcastNotice(noticeData) {
        const { title, message, audience, driveId } = noticeData;

        let targetUsns = [];

        if (audience === "applied" && driveId) {
            const apps = await applicationRepository.getAll({ drive_id: driveId });
            targetUsns = [...new Set(apps.map(a => a.usn))];
        } else if (audience === "eligible" && driveId) {
            const allStudents = await studentRepository.getAll();
            const checks = await Promise.all(
                allStudents.map(async s => {
                    const ok = await eligibilityService.isStudentEligibleForDrive(s, driveId);
                    return ok ? s.usn : null;
                })
            );
            targetUsns = checks.filter(Boolean);
        } else {
            // All students
            const allStudents = await studentRepository.getAll();
            targetUsns = allStudents.map(s => s.usn);
        }

        const allNotifications = await notificationRepository.getAll();
        const notifNums = allNotifications
            .map(n => {
                const match = String(n.n_id).match(/^NOTIF(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));
        let nextNotifNum = (notifNums.length > 0 ? Math.max(...notifNums) : 0) + 1;

        const created = [];
        const now = new Date().toISOString();

        for (const usn of targetUsns) {
            const nId = `NOTIF${String(nextNotifNum++).padStart(4, "0")}`;
            const row = await notificationRepository.create({
                n_id: nId,
                aid: null,
                usn,
                title,
                message,
                read_status: "Unread",
                sent_at: now
            });
            created.push(row);
        }

        return {
            total_sent: created.length,
            audience
        };
    }
};

module.exports = notificationService;
