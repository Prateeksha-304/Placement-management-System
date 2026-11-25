const fs = require("fs");
const path = require("path");
const driveRepository = require("../repositories/driveRepository");

const SCHEDULE_FILE = path.join(__dirname, "../data/drive_schedules.json");

function loadSchedules() {
    try {
        if (fs.existsSync(SCHEDULE_FILE)) {
            const raw = fs.readFileSync(SCHEDULE_FILE, "utf-8");
            return JSON.parse(raw);
        }
    } catch {}
    return {};
}

function saveSchedules(schedules) {
    try {
        const dir = path.dirname(SCHEDULE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2), "utf-8");
    } catch (err) {
        console.warn("[DriveExpiration] Could not persist schedule file:", err.message);
    }
}

let schedulesCache = loadSchedules();

/**
 * Check if a deadline has been reached or crossed in Indian Standard Time (IST / Asia/Kolkata)
 * @param {string|Date|null} deadlineValue 
 * @returns {boolean}
 */
function isDeadlineReached(deadlineValue) {
    if (!deadlineValue) return false;

    const str = String(deadlineValue).trim();
    if (!str) return false;

    const now = Date.now();

    // Check if format is YYYY-MM-DD (date only)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        // Expiration is at the end of that day in IST (UTC+05:30)
        const endOfDayIst = new Date(`${str}T23:59:59.999+05:30`);
        if (!isNaN(endOfDayIst.getTime())) {
            return now > endOfDayIst.getTime();
        }
    }

    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) {
        return false;
    }

    return now >= parsed.getTime();
}

let expirationInterval = null;

const driveExpirationService = {
    isDeadlineReached,

    setDriveSchedule(driveId, deadline, arrivalDate) {
        if (!driveId) return;
        const current = schedulesCache[driveId] || {};
        if (deadline !== undefined) current.deadline = deadline || null;
        if (arrivalDate !== undefined) current.arrival_date = arrivalDate || null;
        schedulesCache[driveId] = current;
        saveSchedules(schedulesCache);
    },

    getDriveSchedule(driveId) {
        return schedulesCache[driveId] || {};
    },

    /**
     * Scan active placement drives and update expired ones to 'Closed' in Supabase
     */
    async checkAndCloseExpiredDrives() {
        try {
            const drives = await driveRepository.getAll();
            const activeDrives = drives.filter(d => (d.status || "Active") === "Active");

            const closedIds = [];

            for (const drive of activeDrives) {
                const schedule = schedulesCache[drive.drive_id] || {};
                const deadline = drive.application_deadline || drive.deadline || schedule.deadline;
                if (deadline && isDeadlineReached(deadline)) {
                    await driveRepository.update(drive.drive_id, { status: "Closed" });
                    closedIds.push(drive.drive_id);
                    console.log(
                        `[DriveExpiration] Automatically closed expired placement drive ${drive.drive_id} (${drive.name}). Deadline was: ${deadline}`
                    );
                }
            }

            return closedIds;
        } catch (err) {
            console.error("[DriveExpiration] Error running drive expiration check:", err.message);
            return [];
        }
    },

    /**
     * Start background recurring expiration job
     * @param {number} intervalMs Defaults to 60,000ms (1 minute)
     */
    startScheduledJob(intervalMs = 60000) {
        if (expirationInterval) {
            clearInterval(expirationInterval);
        }

        // Run immediately on start
        this.checkAndCloseExpiredDrives().catch(() => {});

        // Repeat periodically
        expirationInterval = setInterval(() => {
            this.checkAndCloseExpiredDrives().catch(() => {});
        }, intervalMs);

        console.log(`[DriveExpiration] Scheduled drive expiration job running every ${Math.round(intervalMs / 1000)}s.`);
    },

    stopScheduledJob() {
        if (expirationInterval) {
            clearInterval(expirationInterval);
            expirationInterval = null;
        }
    }
};

module.exports = driveExpirationService;
