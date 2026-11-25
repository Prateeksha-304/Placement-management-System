const studentRepository = require("../repositories/studentRepository");
const companyRepository = require("../repositories/companyRepository");
const driveRepository = require("../repositories/driveRepository");
const applicationRepository = require("../repositories/applicationRepository");
const placementHistoryRepository = require("../repositories/placementHistoryRepository");
const { APPLICATION_STATUS } = require("../utils/statusConstants");

const reportService = {
    /**
     * Placement Officer Dashboard Statistics
     */
    async getOfficerDashboardStats() {
        const [students, companies, drives, applications] = await Promise.all([
            studentRepository.getAll(),
            companyRepository.getAll(),
            driveRepository.getAll(),
            applicationRepository.getAll()
        ]);

        return {
            total_students: students.length,
            total_companies: companies.length,
            total_drives: drives.length,
            total_applications: applications.length,
            total_shortlisted: applications.filter(a => a.status === APPLICATION_STATUS.SHORTLISTED).length,
            total_selected: applications.filter(a => a.status === APPLICATION_STATUS.SELECTED).length,
            total_rejected: applications.filter(a => a.status === APPLICATION_STATUS.REJECTED).length
        };
    },

    /**
     * Placement Coordinator Dashboard Statistics
     */
    async getCoordinatorDashboardStats() {
        const [students, companies, drives, applications, history] = await Promise.all([
            studentRepository.getAll(),
            companyRepository.getAll(),
            driveRepository.getAll(),
            applicationRepository.getAll(),
            placementHistoryRepository.getAll()
        ]);

        const totalStudents = students.length;

        // DISTINCT placed students calculation
        const placedUsnSet = new Set([
            ...students.filter(s => s.status === "Placed").map(s => s.usn),
            ...history.map(h => h.usn),
            ...applications.filter(a => a.status === APPLICATION_STATUS.SELECTED).map(a => a.usn)
        ]);
        const placedCount = placedUsnSet.size;

        const placementPercentage = totalStudents > 0
            ? Number(((placedCount / totalStudents) * 100).toFixed(1))
            : 0;

        // Package statistics
        const driveMap = new Map(drives.map(d => [d.drive_id, d]));
        const selectedPackages = applications
            .filter(a => a.status === APPLICATION_STATUS.SELECTED)
            .map(a => Number(driveMap.get(a.drive_id)?.sal_lpa || 0))
            .filter(p => p > 0);

        const avgPackage = selectedPackages.length > 0
            ? Number((selectedPackages.reduce((sum, p) => sum + p, 0) / selectedPackages.length).toFixed(2))
            : 0;

        const highestPackage = selectedPackages.length > 0
            ? Math.max(...selectedPackages)
            : 0;

        return {
            total_students: totalStudents,
            total_placed_students: placedCount,
            placement_percentage: placementPercentage,
            total_companies: companies.length,
            total_drives: drives.length,
            total_applications: applications.length,
            total_selected_applications: applications.filter(a => a.status === APPLICATION_STATUS.SELECTED).length,
            average_package_lpa: avgPackage,
            highest_package_lpa: highestPackage
        };
    },

    /**
     * Placement Coordinator Analytical Reports
     */
    async getCoordinatorReports() {
        const [students, applications, history, companies] = await Promise.all([
            studentRepository.getAll(),
            applicationRepository.getAll(),
            placementHistoryRepository.getAll(),
            companyRepository.getAll()
        ]);

        // Placed student set
        const placedUsnSet = new Set([
            ...students.filter(s => s.status === "Placed").map(s => s.usn),
            ...history.map(h => h.usn),
            ...applications.filter(a => a.status === APPLICATION_STATUS.SELECTED).map(a => a.usn)
        ]);

        // 1. Branch-wise breakdown
        const branchGroups = {};
        for (const s of students) {
            const b = s.branch || "Other";
            if (!branchGroups[b]) {
                branchGroups[b] = { branch: b, total: 0, placed: 0, unplaced: 0 };
            }
            branchGroups[b].total += 1;
            if (placedUsnSet.has(s.usn)) {
                branchGroups[b].placed += 1;
            } else {
                branchGroups[b].unplaced += 1;
            }
        }
        const branchStatistics = Object.values(branchGroups).map(bg => ({
            ...bg,
            placement_percentage: bg.total > 0 ? Number(((bg.placed / bg.total) * 100).toFixed(1)) : 0
        }));

        // 2. Academic year statistics from placement_history with salary range breakdown
        const yearGroups = {};
        for (const h of history) {
            const yr = h.academic_year || "Unknown";
            if (!yearGroups[yr]) {
                yearGroups[yr] = {
                    academic_year: yr,
                    placed_students: new Set(),
                    total_offers: 0,
                    missing_package_count: 0,
                    salary_ranges: {
                        "0–5 LPA": new Set(),
                        "5–10 LPA": new Set(),
                        "10–15 LPA": new Set(),
                        "15–20 LPA": new Set(),
                        "20–25 LPA": new Set(),
                        "25–30 LPA": new Set(),
                        "30+ LPA": new Set()
                    }
                };
            }
            yearGroups[yr].placed_students.add(h.usn);
            yearGroups[yr].total_offers += 1;

            const pkg = (h.package_lpa !== null && h.package_lpa !== undefined && !isNaN(Number(h.package_lpa)))
                ? Number(h.package_lpa)
                : null;

            if (pkg === null) {
                yearGroups[yr].missing_package_count += 1;
            } else {
                if (pkg >= 0 && pkg < 5) yearGroups[yr].salary_ranges["0–5 LPA"].add(h.usn);
                else if (pkg >= 5 && pkg < 10) yearGroups[yr].salary_ranges["5–10 LPA"].add(h.usn);
                else if (pkg >= 10 && pkg < 15) yearGroups[yr].salary_ranges["10–15 LPA"].add(h.usn);
                else if (pkg >= 15 && pkg < 20) yearGroups[yr].salary_ranges["15–20 LPA"].add(h.usn);
                else if (pkg >= 20 && pkg < 25) yearGroups[yr].salary_ranges["20–25 LPA"].add(h.usn);
                else if (pkg >= 25 && pkg < 30) yearGroups[yr].salary_ranges["25–30 LPA"].add(h.usn);
                else if (pkg >= 30) yearGroups[yr].salary_ranges["30+ LPA"].add(h.usn);
            }
        }
        const yearStatistics = Object.values(yearGroups)
            .map(yg => ({
                academic_year: yg.academic_year,
                placed_count: yg.placed_students.size,
                total_offers: yg.total_offers,
                missing_package_count: yg.missing_package_count,
                salary_ranges: Object.entries(yg.salary_ranges).map(([range, set]) => ({
                    range,
                    count: set.size
                }))
            }))
            .sort((a, b) => b.academic_year.localeCompare(a.academic_year));

        // 3. Company-wise placement distribution
        const companyMap = new Map(companies.map(c => [c.company_id, c]));
        const companyPlacements = {};
        for (const h of history) {
            const cName = companyMap.get(h.company_id)?.name || h.company_id;
            companyPlacements[cName] = (companyPlacements[cName] || 0) + 1;
        }

        return {
            branch_statistics: branchStatistics,
            year_statistics: yearStatistics,
            company_distribution: companyPlacements
        };
    },

    /**
     * Comprehensive Placed Students List for Coordinator
     */
    async getCoordinatorPlacements() {
        const [history, students, companies, drives, applications] = await Promise.all([
            placementHistoryRepository.getAll(),
            studentRepository.getAll(),
            companyRepository.getAll(),
            driveRepository.getAll(),
            applicationRepository.getAll({ status: APPLICATION_STATUS.SELECTED })
        ]);

        const studentMap = new Map(students.map(s => [s.usn, s]));
        const companyMap = new Map(companies.map(c => [c.company_id, c]));
        const driveMap = new Map(drives.map(d => [d.drive_id, d]));

        // Collect placements from both history and selected applications without duplication
        const placementList = [];
        const seen = new Set();

        for (const h of history) {
            const key = `${h.usn}-${h.company_id}`;
            seen.add(key);
            const student = studentMap.get(h.usn);
            const company = companyMap.get(h.company_id);

            // Use verified package_lpa from placement_history. Do NOT assume placement_drives.sal_lpa represents a historical offer.
            const pkgLpa = (h.package_lpa !== null && h.package_lpa !== undefined && !isNaN(Number(h.package_lpa)))
                ? Number(Number(h.package_lpa).toFixed(2))
                : null;

            placementList.push({
                placement_id: h.plac_id,
                usn: h.usn,
                student_name: student ? [student.fname, student.mname, student.lname].filter(Boolean).join(" ") : h.usn,
                branch: student?.branch || "N/A",
                cgpa: student?.cgpa || 0,
                company_id: h.company_id,
                company_name: company?.name || h.company_id,
                role: h.roles || "Selected Role",
                package_lpa: pkgLpa,
                sal_lpa: pkgLpa,
                package: pkgLpa !== null ? Math.round(pkgLpa * 100000) : null,
                academic_year: h.academic_year
            });
        }

        // Add any selected application not yet in history
        for (const app of applications) {
            const drive = driveMap.get(app.drive_id);
            if (!drive) continue;
            const key = `${app.usn}-${drive.company_id}`;
            if (!seen.has(key)) {
                seen.add(key);
                const student = studentMap.get(app.usn);
                const company = companyMap.get(drive.company_id);
                const now = new Date(app.date || Date.now());
                const yr = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
                const pkgLpa = (drive.sal_lpa !== null && drive.sal_lpa !== undefined && !isNaN(Number(drive.sal_lpa)))
                    ? Number(Number(drive.sal_lpa).toFixed(2))
                    : null;

                placementList.push({
                    placement_id: `APP-RECORD-${app.app_id}`,
                    usn: app.usn,
                    student_name: student ? [student.fname, student.mname, student.lname].filter(Boolean).join(" ") : app.usn,
                    branch: student?.branch || "N/A",
                    cgpa: student?.cgpa || 0,
                    company_id: drive.company_id,
                    company_name: company?.name || drive.company_id,
                    role: drive.role_for || drive.name,
                    package_lpa: pkgLpa,
                    sal_lpa: pkgLpa,
                    package: pkgLpa !== null ? Math.round(pkgLpa * 100000) : null,
                    academic_year: `${yr}-${yr + 1}`
                });
            }
        }

        return placementList;
    },

    /**
     * Update verified package_lpa for a historical placement record
     */
    async updatePlacementPackage(placId, packageLpa) {
        const validPackage = (packageLpa !== null && packageLpa !== undefined && packageLpa !== "" && !isNaN(Number(packageLpa)))
            ? Number(Number(packageLpa).toFixed(2))
            : null;

        if (validPackage !== null && validPackage < 0) {
            const err = new Error("Package LPA must be a non-negative number.");
            err.statusCode = 400;
            throw err;
        }

        const existing = await placementHistoryRepository.findById(placId);
        if (!existing) {
            const err = new Error(`Placement history record ${placId} not found.`);
            err.statusCode = 404;
            throw err;
        }

        const updated = await placementHistoryRepository.updatePackageLpa(placId, validPackage);
        return updated;
    }
    };
module.exports = reportService;
