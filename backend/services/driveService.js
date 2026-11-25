const driveRepository = require("../repositories/driveRepository");
const companyRepository = require("../repositories/companyRepository");
const eligibilityRepository = require("../repositories/eligibilityRepository");
const applicationRepository = require("../repositories/applicationRepository");
const driveExpirationService = require("./driveExpirationService");

const driveService = {
    /**
     * Get all drives combined with company and eligibility criteria
     */
    async getAllDrives() {
        // Automatically check and close any drives that have crossed deadline
        await driveExpirationService.checkAndCloseExpiredDrives().catch(() => {});

        const [drives, companies, criteriaList] = await Promise.all([
            driveRepository.getAll(),
            companyRepository.getAll(),
            eligibilityRepository.getAll()
        ]);

        const companyMap = new Map(companies.map(c => [c.company_id, c]));
        const criteriaMap = new Map(criteriaList.map(cr => [cr.drive_id, cr]));

        return drives.map(drive => {
            const company = companyMap.get(drive.company_id);
            const criteria = criteriaMap.get(drive.drive_id);
            const schedule = driveExpirationService.getDriveSchedule(drive.drive_id);
            const deadline = drive.application_deadline || drive.deadline || schedule.deadline || null;
            const arrivalDate = drive.arrival_date || schedule.arrival_date || null;
            const isClosed = drive.status === "Closed" || driveExpirationService.isDeadlineReached(deadline);

            return {
                ...drive,
                status: isClosed ? "Closed" : (drive.status || "Active"),
                application_deadline: deadline,
                deadline: deadline,
                arrival_date: arrivalDate,
                arrivalDate: arrivalDate,
                company_name: company?.name || drive.company_id,
                company_email: company?.email || "",
                company_type: company?.type || "",
                criteria: criteria || null
            };
        });
    },

    async getDriveById(driveId) {
        const drive = await driveRepository.findById(driveId);
        if (!drive) {
            const err = new Error("Placement drive not found.");
            err.statusCode = 404;
            throw err;
        }

        const [company, criteria] = await Promise.all([
            companyRepository.findById(drive.company_id),
            eligibilityRepository.findByDriveId(driveId)
        ]);

        const schedule = driveExpirationService.getDriveSchedule(driveId);
        const deadline = drive.application_deadline || drive.deadline || schedule.deadline || null;
        const arrivalDate = drive.arrival_date || schedule.arrival_date || null;

        return {
            ...drive,
            application_deadline: deadline,
            deadline: deadline,
            arrival_date: arrivalDate,
            arrivalDate: arrivalDate,
            company_name: company?.name || drive.company_id,
            company_email: company?.email || "",
            company_type: company?.type || "",
            criteria: criteria || null
        };
    },

    async createDrive(driveData, criteriaData = {}) {
        const company = await companyRepository.findById(driveData.company_id);
        if (!company) {
            const err = new Error(`Referenced company '${driveData.company_id}' does not exist.`);
            err.statusCode = 404;
            throw err;
        }

        // Generate drive_id
        const existingDrives = await driveRepository.getAll();
        const drvNums = existingDrives
            .map(d => {
                const match = String(d.drive_id).match(/^DRV(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const nextDriveNum = (drvNums.length > 0 ? Math.max(...drvNums) : 0) + 1;
        const newDriveId = driveData.drive_id || `DRV${String(nextDriveNum).padStart(3, "0")}`;

        const deadline = driveData.application_deadline || driveData.deadline || null;
        const arrivalDate = driveData.arrival_date || driveData.arrivalDate || null;
        const isExpired = deadline && driveExpirationService.isDeadlineReached(deadline);

        const drivePayload = {
            drive_id: newDriveId,
            company_id: driveData.company_id,
            name: driveData.name?.trim(),
            sal_lpa: Number(driveData.sal_lpa) || 0,
            role_for: driveData.role_for?.trim() || "",
            is_internship: Boolean(driveData.is_internship),
            status: isExpired ? "Closed" : (driveData.status || "Active")
        };

        const createdDrive = await driveRepository.create(drivePayload);

        // Store schedule
        driveExpirationService.setDriveSchedule(newDriveId, deadline, arrivalDate);

        // Generate eligibility criteria
        const existingCriteria = await eligibilityRepository.getAll();
        const elgNums = existingCriteria
            .map(c => {
                const match = String(c.elg_id).match(/^ELG(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const nextElgNum = (elgNums.length > 0 ? Math.max(...elgNums) : 0) + 1;
        const newElgId = `ELG${String(nextElgNum).padStart(3, "0")}`;

        const criteriaPayload = {
            elg_id: newElgId,
            drive_id: newDriveId,
            sem: Number(criteriaData.sem) || 7,
            allowed_branch: Array.isArray(criteriaData.allowed_branch)
                ? criteriaData.allowed_branch.join(",")
                : (criteriaData.allowed_branch || "CSE,CSE(AI),ECE,EEE,Mech"),
            min_cgpa: Number(criteriaData.min_cgpa) || 0,
            max_backlog: Number(criteriaData.max_backlog) || 0,
            min_sslc: Number(criteriaData.min_sslc ?? criteriaData.minSslc ?? 60),
            min_puc: Number(criteriaData.min_puc ?? criteriaData.minPuc ?? 60)
        };

        const createdCriteria = await eligibilityRepository.create(criteriaPayload);

        return {
            ...createdDrive,
            application_deadline: deadline,
            deadline: deadline,
            arrival_date: arrivalDate,
            arrivalDate: arrivalDate,
            company_name: company.name,
            criteria: createdCriteria
        };
    },

    async updateDrive(driveId, updates, criteriaUpdates) {
        await this.getDriveById(driveId);

        const updatedDeadline = updates.application_deadline !== undefined ? updates.application_deadline : updates.deadline;
        const updatedArrival = updates.arrival_date !== undefined ? updates.arrival_date : updates.arrivalDate;

        const drivePayload = {};
        if (updates.name !== undefined) drivePayload.name = updates.name?.trim();
        if (updates.sal_lpa !== undefined) drivePayload.sal_lpa = Number(updates.sal_lpa);
        if (updates.role_for !== undefined) drivePayload.role_for = updates.role_for?.trim();
        if (updates.is_internship !== undefined) drivePayload.is_internship = Boolean(updates.is_internship);
        if (updates.status !== undefined) drivePayload.status = updates.status;

        if (updatedDeadline !== undefined && updatedDeadline) {
            if (driveExpirationService.isDeadlineReached(updatedDeadline)) {
                drivePayload.status = "Closed";
            }
        }

        let updatedDrive = Object.keys(drivePayload).length > 0
            ? await driveRepository.update(driveId, drivePayload)
            : await driveRepository.findById(driveId);

        driveExpirationService.setDriveSchedule(driveId, updatedDeadline, updatedArrival);

        let updatedCriteria = null;
        if (criteriaUpdates) {
            const criteriaPayload = {};
            if (criteriaUpdates.sem !== undefined) criteriaPayload.sem = Number(criteriaUpdates.sem);
            if (criteriaUpdates.allowed_branch !== undefined) {
                criteriaPayload.allowed_branch = Array.isArray(criteriaUpdates.allowed_branch)
                    ? criteriaUpdates.allowed_branch.join(",")
                    : criteriaUpdates.allowed_branch;
            }
            if (criteriaUpdates.min_cgpa !== undefined) criteriaPayload.min_cgpa = Number(criteriaUpdates.min_cgpa);
            if (criteriaUpdates.max_backlog !== undefined) criteriaPayload.max_backlog = Number(criteriaUpdates.max_backlog);
            if (criteriaUpdates.min_sslc !== undefined || criteriaUpdates.minSslc !== undefined) {
                criteriaPayload.min_sslc = Number(criteriaUpdates.min_sslc ?? criteriaUpdates.minSslc);
            }
            if (criteriaUpdates.min_puc !== undefined || criteriaUpdates.minPuc !== undefined) {
                criteriaPayload.min_puc = Number(criteriaUpdates.min_puc ?? criteriaUpdates.minPuc);
            }

            if (Object.keys(criteriaPayload).length > 0) {
                const existing = await eligibilityRepository.findByDriveId(driveId);
                if (existing) {
                    updatedCriteria = await eligibilityRepository.updateByDriveId(driveId, criteriaPayload);
                } else {
                    const allCriteria = await eligibilityRepository.getAll();
                    const elgNums = allCriteria
                        .map(c => {
                            const match = String(c.elg_id).match(/^ELG(\d+)$/i);
                            return match ? parseInt(match[1], 10) : 0;
                        })
                        .filter(n => !isNaN(n));
                    const nextElgNum = (elgNums.length > 0 ? Math.max(...elgNums) : 0) + 1;
                    const newElgId = `ELG${String(nextElgNum).padStart(3, "0")}`;
                    updatedCriteria = await eligibilityRepository.create({
                        elg_id: newElgId,
                        drive_id: driveId,
                        sem: criteriaPayload.sem || 7,
                        allowed_branch: criteriaPayload.allowed_branch || "CSE,CSE(AI),ECE,EEE,Mech",
                        min_cgpa: criteriaPayload.min_cgpa || 0,
                        max_backlog: criteriaPayload.max_backlog || 0,
                        min_sslc: criteriaPayload.min_sslc ?? 60,
                        min_puc: criteriaPayload.min_puc ?? 60
                    });
                }
            }
        }

        const schedule = driveExpirationService.getDriveSchedule(driveId);

        return {
            ...updatedDrive,
            application_deadline: schedule.deadline || updatedDrive.application_deadline,
            deadline: schedule.deadline || updatedDrive.application_deadline,
            arrival_date: schedule.arrival_date,
            arrivalDate: schedule.arrival_date,
            criteria: updatedCriteria
        };
    },

    async deleteDrive(driveId) {
        // Cascade delete eligibility criteria first
        await eligibilityRepository.deleteByDriveId(driveId).catch(() => {});
        return await driveRepository.delete(driveId);
    }
};

module.exports = driveService;
