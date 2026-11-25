const studentRepository = require("../repositories/studentRepository");
const applicationRepository = require("../repositories/applicationRepository");
const placementHistoryRepository = require("../repositories/placementHistoryRepository");
const driveRepository = require("../repositories/driveRepository");
const companyRepository = require("../repositories/companyRepository");
const eligibilityService = require("./eligibilityService");

const studentService = {
    /**
     * Get comprehensive student profile with placement stats
     */
    async getProfile(usn) {
        const student = await studentRepository.findByUsn(usn);
        if (!student) {
            const err = new Error("Student record not found.");
            err.statusCode = 404;
            throw err;
        }

        const [applications, placementHistory, eligibleDrivesData] = await Promise.all([
            applicationRepository.findByUsn(usn),
            placementHistoryRepository.findByUsn(usn),
            eligibilityService.getEligibleDrivesForStudent(usn).catch(() => ({ total_core_eligible_drives: 0 }))
        ]);

        const fullName = [student.fname, student.mname, student.lname].filter(Boolean).join(" ");

        return {
            usn: student.usn,
            roll_no: student.roll_no,
            name: fullName,
            fname: student.fname,
            mname: student.mname,
            lname: student.lname,
            dob: student.dob || null,
            email: student.email,
            phone: student.phone,
            branch: student.branch,
            semester: student.sem,
            cgpa: student.cgpa,
            active_backlogs: student.active_backlog,
            sslc_percentage: student.sslc_percentage,
            puc_percentage: student.puc_percentage,
            resume: student.resume,
            is_eligible: student.is_elg,
            placement_status: student.status,
            total_eligible_drives: eligibleDrivesData.total_core_eligible_drives || 0,
            total_applications: applications.length,
            shortlisted_count: applications.filter(a => a.status === "Shortlisted").length,
            selected_count: applications.filter(a => a.status === "Selected").length,
            rejected_count: applications.filter(a => a.status === "Rejected").length,
            placements: placementHistory
        };
    },

    /**
     * Get student's current placement status and 40% reapplication package threshold
     */
    async getPlacementStatus(usn) {
        const student = await studentRepository.findByUsn(usn);
        if (!student) {
            const err = new Error("Student record not found.");
            err.statusCode = 404;
            throw err;
        }

        const isPlaced = student.status === "Placed";
        let currentPackage = null;
        let currentCompany = null;
        let currentRole = null;
        let currentDriveId = null;

        const myApps = await applicationRepository.findByUsn(usn);
        const selectedApps = myApps.filter(a => a.status === "Selected");

        if (selectedApps.length > 0) {
            const allDrives = await driveRepository.getAll();
            const driveMap = new Map(allDrives.map(d => [d.drive_id, d]));
            const allCompanies = await companyRepository.getAll();
            const companyMap = new Map(allCompanies.map(c => [c.company_id, c]));

            let maxPkg = -1;
            let bestDrive = null;

            for (const app of selectedApps) {
                const drive = driveMap.get(app.drive_id);
                if (drive && Number(drive.sal_lpa || 0) > maxPkg) {
                    maxPkg = Number(drive.sal_lpa);
                    bestDrive = drive;
                }
            }

            if (bestDrive) {
                currentPackage = Number(bestDrive.sal_lpa);
                currentRole = bestDrive.role_for || bestDrive.name;
                currentDriveId = bestDrive.drive_id;
                const company = companyMap.get(bestDrive.company_id);
                currentCompany = company ? company.name : "Company";
            }
        }

        const minEligiblePackage = isPlaced && currentPackage !== null
            ? Math.round(currentPackage * 1.40 * 100) / 100
            : null;

        return {
            usn: student.usn,
            name: [student.fname, student.mname, student.lname].filter(Boolean).join(" "),
            status: student.status,
            is_placed: isPlaced,
            current_package: currentPackage,
            current_company: currentCompany,
            current_role: currentRole,
            current_drive_id: currentDriveId,
            min_eligible_package: minEligiblePackage,
            reapplication_multiplier: 1.40
        };
    },

    /**
     * Get all students list
     */
    async getAllStudents() {
        return studentRepository.getAll();
    }
};

module.exports = studentService;
