const studentRepository = require("../repositories/studentRepository");
const driveRepository = require("../repositories/driveRepository");
const companyRepository = require("../repositories/companyRepository");
const eligibilityRepository = require("../repositories/eligibilityRepository");
const driveExpirationService = require("./driveExpirationService");

/**
 * Check whether a student satisfies 10th (SSLC) and 12th (PUC) percentage criteria
 * Checks both direct columns (min_sslc, min_puc) and criteria.other text patterns
 * @param {Object} student { sslc_percentage, puc_percentage }
 * @param {Object|string} criteria { min_sslc, min_puc, other }
 * @returns {boolean}
 */
function checkPercentageEligibility(student, criteria) {
    if (!criteria) return true;

    const studentSslc = Number(student.sslc_percentage ?? student.sslcPercentage ?? 0);
    const studentPuc = Number(student.puc_percentage ?? student.pucPercentage ?? 0);

    // 1. Check direct columns min_sslc and min_puc from eligibility_criteria table
    if (typeof criteria === "object") {
        if (criteria.min_sslc !== undefined && criteria.min_sslc !== null && criteria.min_sslc !== "") {
            const requiredSslc = Number(criteria.min_sslc);
            if (studentSslc < requiredSslc) {
                return false;
            }
        }

        if (criteria.min_puc !== undefined && criteria.min_puc !== null && criteria.min_puc !== "") {
            const requiredPuc = Number(criteria.min_puc);
            if (studentPuc < requiredPuc) {
                return false;
            }
        }
    }

    // 2. Check fallback other text if present
    const otherText = typeof criteria === "string" ? criteria : criteria.other;
    if (otherText && typeof otherText === "string") {
        const jointMatch = otherText.match(/10th\/12th\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
        if (jointMatch) {
            const required = parseFloat(jointMatch[1]);
            if (studentSslc < required || studentPuc < required) {
                return false;
            }
        }

        const tenthMatch = otherText.match(/10th\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
        if (tenthMatch) {
            const requiredTenth = parseFloat(tenthMatch[1]);
            if (studentSslc < requiredTenth) {
                return false;
            }
        }

        const twelfthMatch = otherText.match(/12th(?:\/Diploma)?\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
        if (twelfthMatch) {
            const requiredTwelfth = parseFloat(twelfthMatch[1]);
            if (studentPuc < requiredTwelfth) {
                return false;
            }
        }
    }

    return true;
}

const eligibilityService = {
    checkPercentageEligibility,

    /**
     * Calculate eligible placement drives for a given USN
     */
    async getEligibleDrivesForStudent(usn) {
        const student = await studentRepository.findByUsn(usn);

        if (!student) {
            const err = new Error("Student not found");
            err.statusCode = 404;
            err.details = { searched_usn: usn };
            throw err;
        }

        const [criteriaList, drives, companies] = await Promise.all([
            eligibilityRepository.getAll(),
            driveRepository.getAll(),
            companyRepository.getAll()
        ]);

        const eligibleDrives = criteriaList
            .filter((criteria) => {
                // Semester check
                const semesterMatch = Number(student.sem) === Number(criteria.sem);

                // Branch check
                const allowedBranches = String(criteria.allowed_branch || "")
                    .split(",")
                    .map((b) => b.trim().toLowerCase());

                const branchMatch = allowedBranches.includes(
                    String(student.branch || "").trim().toLowerCase()
                );

                // CGPA check
                const cgpaMatch = Number(student.cgpa) >= Number(criteria.min_cgpa);

                // Active backlog check
                const backlogMatch =
                    Number(student.active_backlog) <= Number(criteria.max_backlog);

                // 10th (SSLC) and 12th (PUC) percentage check from database (min_sslc, min_puc, and text)
                const percentageMatch = checkPercentageEligibility(student, criteria);

                return semesterMatch && branchMatch && cgpaMatch && backlogMatch && percentageMatch;
            })
            .map((criteria) => {
                const drive = drives.find((d) => d.drive_id === criteria.drive_id);
                if (!drive) return null;

                // Hide closed or expired drives from students' active eligible opportunities
                const isClosed = drive.status === "Closed" || driveExpirationService.isDeadlineReached(drive.application_deadline || drive.deadline);
                if (isClosed) return null;

                const company = companies.find((c) => c.company_id === drive.company_id);

                return {
                    drive_id: drive.drive_id,
                    drive_name: drive.name,
                    company_id: drive.company_id,
                    company_name: company ? company.name : "Unknown Company",
                    role: drive.role_for,
                    package_lpa: drive.sal_lpa,
                    internship: drive.is_internship,
                    min_sslc: criteria.min_sslc ?? 0,
                    min_puc: criteria.min_puc ?? 0,
                    eligibility: {
                        semester: true,
                        branch: true,
                        cgpa: true,
                        backlogs: true,
                        sslc_percentage: true,
                        puc_percentage: true
                    },
                    additional_criteria: criteria.other || `Min SSLC: ${criteria.min_sslc ?? 0}%, Min PUC: ${criteria.min_puc ?? 0}%`,
                    requires_additional_verification: false
                };
            })
            .filter(Boolean);

        return {
            student: {
                usn: student.usn,
                name: `${student.fname || ""} ${student.lname || ""}`.trim(),
                branch: student.branch,
                cgpa: student.cgpa,
                semester: student.sem,
                active_backlogs: student.active_backlog,
                sslc_percentage: student.sslc_percentage,
                puc_percentage: student.puc_percentage,
                dob: student.dob || null
            },
            total_core_eligible_drives: eligibleDrives.length,
            drives: eligibleDrives
        };
    },

    /**
     * Check if a specific student is eligible for a specific drive
     */
    async isStudentEligibleForDrive(student, driveId) {
        const [criteria, drive] = await Promise.all([
            eligibilityRepository.findByDriveId(driveId),
            driveRepository.findById(driveId)
        ]);
        if (!criteria || !drive) return false;

        // Disqualify if drive is closed or registration deadline has expired
        const isClosed = drive.status === "Closed" || driveExpirationService.isDeadlineReached(drive.application_deadline || drive.deadline);
        if (isClosed) return false;

        const semesterMatch = Number(student.sem) === Number(criteria.sem);
        const allowedBranches = String(criteria.allowed_branch || "")
            .split(",")
            .map((b) => b.trim().toLowerCase());
        const branchMatch = allowedBranches.includes(
            String(student.branch || "").trim().toLowerCase()
        );
        const cgpaMatch = Number(student.cgpa) >= Number(criteria.min_cgpa);
        const backlogMatch = Number(student.active_backlog) <= Number(criteria.max_backlog);
        const percentageMatch = checkPercentageEligibility(student, criteria);

        return semesterMatch && branchMatch && cgpaMatch && backlogMatch && percentageMatch;
    }
};

module.exports = eligibilityService;
