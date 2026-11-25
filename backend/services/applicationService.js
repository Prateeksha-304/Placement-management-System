const applicationRepository = require("../repositories/applicationRepository");
const studentRepository = require("../repositories/studentRepository");
const driveRepository = require("../repositories/driveRepository");
const companyRepository = require("../repositories/companyRepository");
const notificationRepository = require("../repositories/notificationRepository");
const placementHistoryRepository = require("../repositories/placementHistoryRepository");
const eligibilityService = require("./eligibilityService");
const driveExpirationService = require("./driveExpirationService");
const { APPLICATION_STATUS } = require("../utils/statusConstants");

const applicationService = {
    /**
     * Submit application for an eligible drive
     * Enforces:
     * 1. Student and drive exist
     * 2. No duplicate applications by same student to same drive
     * 3. Server-side eligibility check (Branch, Sem, CGPA, Backlogs, SSLC %, PUC %)
     * 4. 40% Package Reapplication rule for placed students:
     *    Minimum eligible package = Current placed package * 1.40
     * 5. Stores submitted resume link (or defaults to student profile resume)
     */
    async apply(studentUsn, driveId, customResume = null) {
        // 1. Verify student exists
        const student = await studentRepository.findByUsn(studentUsn);
        if (!student) {
            const err = new Error("Student record not found.");
            err.statusCode = 404;
            throw err;
        }

        // 2. Verify drive exists
        const drive = await driveRepository.findById(driveId);
        if (!drive) {
            const err = new Error("Placement drive not found.");
            err.statusCode = 404;
            throw err;
        }

        // 2b. Prevent applications to closed or expired placement drives
        const isClosed = drive.status === "Closed" || driveExpirationService.isDeadlineReached(drive.application_deadline || drive.deadline);
        if (isClosed) {
            if (drive.status !== "Closed") {
                await driveRepository.update(driveId, { status: "Closed" }).catch(() => {});
            }
            const err = new Error("Registration for this placement drive is closed. Applications are no longer accepted.");
            err.statusCode = 400;
            throw err;
        }

        // 3. Prevent duplicate applications
        const existingApp = await applicationRepository.findByUsnAndDrive(studentUsn, driveId);
        if (existingApp) {
            const err = new Error(`You have already applied for ${drive.name || "this drive"}.`);
            err.statusCode = 409;
            throw err;
        }

        // 4. Server-side eligibility validation
        const isEligible = await eligibilityService.isStudentEligibleForDrive(student, driveId);
        if (!isEligible) {
            const err = new Error("You do not meet the eligibility criteria for this placement drive.");
            err.statusCode = 400;
            throw err;
        }

        // 5. 40% package reapplication rule for placed students:
        // A student whose students.status = 'Placed' must not be allowed to apply for another company
        // unless the new company's package is at least 40% higher than the package of the student's current placed company.
        const isStudentPlaced = student.status === "Placed";
        const myApps = await applicationRepository.findByUsn(studentUsn);
        const selectedApps = myApps.filter(a => a.status === APPLICATION_STATUS.SELECTED);

        if (isStudentPlaced || selectedApps.length > 0) {
            const allDrives = await driveRepository.getAll();
            const driveMap = new Map(allDrives.map(d => [d.drive_id, d]));

            // Determine the current placed package by joining Selected application with placement_drives
            const selectedPackages = selectedApps
                .map(a => Number(driveMap.get(a.drive_id)?.sal_lpa || 0))
                .filter(p => p > 0);

            if (selectedPackages.length === 0) {
                const err = new Error(
                    "Your student record is marked as 'Placed', but your current placement package could not be verified reliably. Please contact the Placement Cell before applying."
                );
                err.statusCode = 400;
                throw err;
            }

            const currentPlacedPackage = Math.max(...selectedPackages);
            const currentDrivePackage = Number(drive.sal_lpa || 0);
            const minRequiredPackage = Math.round(currentPlacedPackage * 1.40 * 100) / 100;

            if (currentDrivePackage < minRequiredPackage) {
                const err = new Error(
                    `As an already-placed student (${currentPlacedPackage} LPA), any new application must offer at least a 40% package increase (>= ${minRequiredPackage.toFixed(2)} LPA). This drive offers ${currentDrivePackage.toFixed(2)} LPA.`
                );
                err.statusCode = 400;
                throw err;
            }
        }

        // 6. Generate app_id
        const allApplications = await applicationRepository.getAll();
        const appNums = allApplications
            .map(a => {
                const match = String(a.app_id).match(/^APP(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const nextAppNum = (appNums.length > 0 ? Math.max(...appNums) : 0) + 1;
        const newAppId = `APP${String(nextAppNum).padStart(4, "0")}`;

        const today = new Date().toISOString().split("T")[0];

        const applicationPayload = {
            app_id: newAppId,
            usn: studentUsn,
            drive_id: driveId,
            date: today,
            status: APPLICATION_STATUS.APPLIED,
            elg_status: "Eligible",
            status_changed_by: "Student",
            status_date: today,
            resume: (customResume && typeof customResume === "string" && customResume.trim())
                ? customResume.trim()
                : (student.resume || null)
        };

        const createdApplication = await applicationRepository.create(applicationPayload);

        // 7. Generate student notification
        try {
            const company = await companyRepository.findById(drive.company_id);
            const allNotifications = await notificationRepository.getAll();
            const notifNums = allNotifications
                .map(n => {
                    const match = String(n.n_id).match(/^NOTIF(\d+)$/i);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(num => !isNaN(num));
            const nextNotifNum = (notifNums.length > 0 ? Math.max(...notifNums) : 0) + 1;
            const newNotifId = `NOTIF${String(nextNotifNum).padStart(4, "0")}`;

            await notificationRepository.create({
                n_id: newNotifId,
                aid: newAppId,
                usn: studentUsn,
                title: `Application Submitted - ${company?.name || drive.name}`,
                message: `Your application for ${drive.role_for || drive.name} at ${company?.name || "the company"} has been submitted successfully.`,
                read_status: "Unread",
                sent_at: new Date().toISOString()
            });
        } catch (notifErr) {
            console.warn("Failed to generate initial application notification:", notifErr.message);
        }

        return createdApplication;
    },

    /**
     * Get applications for the authenticated student
     */
    async getMyApplications(studentUsn) {
        const [myApps, drives, companies] = await Promise.all([
            applicationRepository.findByUsn(studentUsn),
            driveRepository.getAll(),
            companyRepository.getAll()
        ]);

        const driveMap = new Map(drives.map(d => [d.drive_id, d]));
        const companyMap = new Map(companies.map(c => [c.company_id, c]));

        return myApps.map(app => {
            const drive = driveMap.get(app.drive_id);
            const company = drive ? companyMap.get(drive.company_id) : null;

            return {
                ...app,
                drive_name: drive?.name || app.drive_id,
                company_id: drive?.company_id || "",
                company_name: company?.name || "Unknown Company",
                role: drive?.role_for || "",
                sal_lpa: drive?.sal_lpa || 0,
                is_internship: drive?.is_internship || false
            };
        });
    },

    /**
     * Get all applications with complete joins for Placement Officer:
     * - Application details: app_id, date, status, elg_status, status_changed_by, status_date
     * - Student details: usn, student_name, roll_no, branch, semester, cgpa, active_backlog, email, phone, dob, sslc_percentage, puc_percentage, resume
     * - Drive details: drive_id, drive_name, company_name, role, sal_lpa, is_internship
     */
    async getAllApplications(filters = {}) {
        const [applications, students, drives, companies] = await Promise.all([
            applicationRepository.getAll(filters),
            studentRepository.getAll(),
            driveRepository.getAll(),
            companyRepository.getAll()
        ]);

        const studentMap = new Map(students.map(s => [s.usn, s]));
        const driveMap = new Map(drives.map(d => [d.drive_id, d]));
        const companyMap = new Map(companies.map(c => [c.company_id, c]));

        return applications.map(app => {
            const student = studentMap.get(app.usn);
            const drive = driveMap.get(app.drive_id);
            const company = drive ? companyMap.get(drive.company_id) : null;
            const studentName = student
                ? [student.fname, student.mname, student.lname].filter(Boolean).join(" ")
                : app.usn;

            return {
                app_id: app.app_id,
                date: app.date,
                status: app.status,
                elg_status: app.elg_status || "Eligible",
                status_changed_by: app.status_changed_by || null,
                status_date: app.status_date || app.date,

                // Student Details
                usn: app.usn,
                student_name: studentName,
                roll_no: student?.roll_no || "—",
                branch: student?.branch || "—",
                semester: student?.sem ?? "—",
                cgpa: student?.cgpa ?? "—",
                active_backlog: student?.active_backlog ?? 0,
                email: student?.email || "—",
                phone: student?.phone || "—",
                dob: student?.dob || null,
                sslc_percentage: student?.sslc_percentage ?? null,
                puc_percentage: student?.puc_percentage ?? null,
                resume: app.resume || student?.resume || null,
                application_resume: app.resume || null,
                student_resume: student?.resume || null,

                // Placement Drive Details
                drive_id: app.drive_id,
                drive_name: drive?.name || app.drive_id,
                company_id: drive?.company_id || "",
                company_name: company?.name || "Unknown Company",
                role: drive?.role_for || "",
                sal_lpa: drive?.sal_lpa || 0,
                is_internship: Boolean(drive?.is_internship)
            };
        });
    },

    /**
     * Get a single application by ID with complete joined student, drive, and company details
     */
    async getApplicationById(appId) {
        const app = await applicationRepository.findById(appId);
        if (!app) {
            const err = new Error("Application not found.");
            err.statusCode = 404;
            throw err;
        }

        const [student, drive] = await Promise.all([
            studentRepository.findByUsn(app.usn),
            driveRepository.findById(app.drive_id)
        ]);

        const company = drive ? await companyRepository.findById(drive.company_id) : null;
        const studentName = student
            ? [student.fname, student.mname, student.lname].filter(Boolean).join(" ")
            : app.usn;

        return {
            app_id: app.app_id,
            date: app.date,
            status: app.status,
            elg_status: app.elg_status || "Eligible",
            status_changed_by: app.status_changed_by || null,
            status_date: app.status_date || app.date,

            // Student Details
            usn: app.usn,
            student_name: studentName,
            roll_no: student?.roll_no || "—",
            branch: student?.branch || "—",
            semester: student?.sem ?? "—",
            cgpa: student?.cgpa ?? "—",
            active_backlog: student?.active_backlog ?? 0,
            email: student?.email || "—",
            phone: student?.phone || "—",
            dob: student?.dob || null,
            sslc_percentage: student?.sslc_percentage ?? null,
            puc_percentage: student?.puc_percentage ?? null,
            resume: app.resume || student?.resume || null,
            application_resume: app.resume || null,
            student_resume: student?.resume || null,

            // Placement Drive Details
            drive_id: app.drive_id,
            drive_name: drive?.name || app.drive_id,
            company_id: drive?.company_id || "",
            company_name: company?.name || "Unknown Company",
            role: drive?.role_for || "",
            sal_lpa: drive?.sal_lpa || 0,
            is_internship: Boolean(drive?.is_internship)
        };
    },

    /**
     * Placement Officer updates application status (Selected or Rejected)
     * When Selected:
     * 1. Updates application status to 'Selected', status_changed_by, status_date
     * 2. Automatically updates student's status in students table to 'Placed' (never 'Selected')
     * 3. Records placement in placement_history with USN, company_id, academic_year, roles
     * 4. Prevents duplicate placement_history records
     * 5. Atomicity & rollback protection
     */
    async updateStatus(appId, newStatus, changedBy = "Placement Officer") {
        const allowedStatuses = [
            APPLICATION_STATUS.APPLIED,
            APPLICATION_STATUS.SELECTED,
            APPLICATION_STATUS.REJECTED
        ];
        if (!allowedStatuses.includes(newStatus)) {
            const err = new Error(`Invalid status '${newStatus}'. Must be one of: ${allowedStatuses.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }

        const app = await applicationRepository.findById(appId);
        if (!app) {
            const err = new Error("Application not found.");
            err.statusCode = 404;
            throw err;
        }

        // Prevent redundant update if status didn't change
        if (app.status === newStatus) {
            return this.getApplicationById(appId);
        }

        const previousStatus = app.status;
        const today = new Date().toISOString().split("T")[0];

        const [drive, student] = await Promise.all([
            driveRepository.findById(app.drive_id),
            studentRepository.findByUsn(app.usn)
        ]);

        if (!drive) {
            const err = new Error("Associated placement drive not found.");
            err.statusCode = 404;
            throw err;
        }
        if (!student) {
            const err = new Error("Associated student record not found.");
            err.statusCode = 404;
            throw err;
        }

        const company = await companyRepository.findById(drive.company_id);

        // Update application status
        const updated = await applicationRepository.updateStatus(appId, newStatus, changedBy, today);

        let createdPlacId = null;

        // Cascade placement history & student status with atomic rollback protection
        try {
            if (newStatus === APPLICATION_STATUS.SELECTED) {
                // 1. Calculate academic year from student or current calendar year
                const academicYear = student.academic_year || (() => {
                    const now = new Date();
                    const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
                    return `${year}-${year + 1}`;
                })();

                // Retrieve actual package from placement drive in Supabase (never accept from frontend)
                const rawPackage = drive?.sal_lpa;
                const packageLpa = (rawPackage !== undefined && rawPackage !== null && rawPackage !== "" && !isNaN(Number(rawPackage)))
                    ? Number(Number(rawPackage).toFixed(2))
                    : null;

                // 2. Prevent duplicate placement-history records for the same selection
                const existingHistory = await placementHistoryRepository.findByUsnAndCompany(
                    app.usn,
                    drive.company_id
                );

                if (existingHistory) {
                    // Update existing record's role and package_lpa without creating duplicate record
                    await placementHistoryRepository.update(existingHistory.plac_id, {
                        roles: drive.role_for || drive.name || existingHistory.roles,
                        package_lpa: packageLpa
                    });
                } else {
                    const newPlacId = await placementHistoryRepository.getNextPlacId();
                    await placementHistoryRepository.create({
                        plac_id: newPlacId,
                        usn: app.usn,
                        company_id: drive.company_id,
                        academic_year: academicYear,
                        roles: drive.role_for || drive.name,
                        package_lpa: packageLpa
                    });
                    createdPlacId = newPlacId;
                }

                // 3. Automatically update student's status to 'Placed' (never 'Selected')
                await studentRepository.updateStatus(app.usn, "Placed");

            } else if (previousStatus === APPLICATION_STATUS.SELECTED && newStatus !== APPLICATION_STATUS.SELECTED) {
                // If previously Selected and now changing to Rejected or Applied, remove from placement history
                await placementHistoryRepository.deleteByUsnAndCompany(app.usn, drive.company_id);

                // Check if student has any other Selected applications
                const allMyApps = await applicationRepository.findByUsn(app.usn);
                const hasOtherSelected = allMyApps.some(a => a.app_id !== appId && a.status === APPLICATION_STATUS.SELECTED);

                if (!hasOtherSelected) {
                    await studentRepository.updateStatus(app.usn, "Not_Placed");
                }
            }
        } catch (cascadeError) {
            // Rollback application status to previous status and clean up created history if cascade fails
            console.error("Cascade update failed. Rolling back application status:", cascadeError.message);
            if (createdPlacId) {
                try {
                    await placementHistoryRepository.delete(createdPlacId);
                } catch (delErr) {
                    console.warn("Rollback cleanup warning:", delErr.message);
                }
            }
            await applicationRepository.updateStatus(appId, previousStatus, app.status_changed_by, app.status_date);
            const err = new Error(`Failed to update placement records: ${cascadeError.message}`);
            err.statusCode = 500;
            throw err;
        }

        // Generate student notification
        try {
            const allNotifications = await notificationRepository.getAll();
            const notifNums = allNotifications
                .map(n => {
                    const match = String(n.n_id).match(/^NOTIF(\d+)$/i);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(num => !isNaN(num));
            const nextNotifNum = (notifNums.length > 0 ? Math.max(...notifNums) : 0) + 1;
            const newNotifId = `NOTIF${String(nextNotifNum).padStart(4, "0")}`;

            const companyName = company?.name || drive?.name || "Company";
            let notifTitle = `Application Status Update - ${companyName}`;
            let notifMsg = `Your application for ${drive?.role_for || "placement drive"} at ${companyName} has been updated to: ${newStatus}.`;

            if (newStatus === APPLICATION_STATUS.SELECTED) {
                notifTitle = `Offer Selected - ${companyName}`;
                notifMsg = `Congratulations! You have been selected for ${drive?.role_for || "the position"} at ${companyName} (${drive?.sal_lpa || 0} LPA). Your student status is now Placed.`;
            } else if (newStatus === APPLICATION_STATUS.REJECTED) {
                notifTitle = `Application Update - ${companyName}`;
                notifMsg = `Your application for ${drive?.role_for || "the position"} at ${companyName} has been marked as Rejected.`;
            }

            await notificationRepository.create({
                n_id: newNotifId,
                aid: appId,
                usn: app.usn,
                title: notifTitle,
                message: notifMsg,
                read_status: "Unread",
                sent_at: new Date().toISOString()
            });
        } catch (notifErr) {
            console.warn("Failed to create status update notification:", notifErr.message);
        }

        return this.getApplicationById(appId);
    }
};

module.exports = applicationService;
