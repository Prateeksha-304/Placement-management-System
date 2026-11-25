const companyRepository = require("../repositories/companyRepository");
const driveRepository = require("../repositories/driveRepository");
const eligibilityRepository = require("../repositories/eligibilityRepository");
const placementHistoryRepository = require("../repositories/placementHistoryRepository");

const companyService = {
    async getAllCompanies() {
        return companyRepository.getAll();
    },

    async getCompanyById(companyId) {
        const company = await companyRepository.findById(companyId);
        if (!company) {
            const err = new Error("Company not found.");
            err.statusCode = 404;
            throw err;
        }
        return company;
    },

    /**
     * Create a company and create separate placement drives for each offered role,
     * linking corresponding eligibility criteria to each drive.
     */
    async createCompany(data) {
        const existingCompanies = await companyRepository.getAll();

        let newId = data.company_id;
        if (!newId) {
            const cmpNums = existingCompanies
                .map(c => {
                    const match = String(c.company_id).match(/^CMP(\d+)$/i);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(n => !isNaN(n));
            const nextNum = (cmpNums.length > 0 ? Math.max(...cmpNums) : 0) + 1;
            newId = `CMP${String(nextNum).padStart(3, "0")}`;
        }

        const companyPayload = {
            company_id: newId,
            name: data.name?.trim(),
            email: data.email?.trim() || null,
            roles_offered: data.roles_offered?.trim() || null,
            type: data.type?.trim() || null
        };

        const createdCompany = await companyRepository.create(companyPayload);

        // Parse individual roles from roles_offered
        const rawRoles = Array.isArray(data.roles_offered)
            ? data.roles_offered
            : String(data.roles_offered || "")
                .split(",")
                .map(r => r.trim())
                .filter(Boolean);

        const rolesToCreate = rawRoles.length > 0 ? rawRoles : [companyPayload.name + " Graduate Role"];

        // Prepare IDs for drives and criteria
        const existingDrives = await driveRepository.getAll();
        const drvNums = existingDrives
            .map(d => {
                const match = String(d.drive_id).match(/^DRV(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        let nextDriveNum = (drvNums.length > 0 ? Math.max(...drvNums) : 0) + 1;

        const existingCriteria = await eligibilityRepository.getAll();
        const elgNums = existingCriteria
            .map(c => {
                const match = String(c.elg_id).match(/^ELG(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        let nextElgNum = (elgNums.length > 0 ? Math.max(...elgNums) : 0) + 1;

        const createdDrives = [];

        for (const role of rolesToCreate) {
            const driveId = `DRV${String(nextDriveNum++).padStart(3, "0")}`;
            const elgId = `ELG${String(nextElgNum++).padStart(3, "0")}`;

            const drivePayload = {
                drive_id: driveId,
                company_id: newId,
                name: `${companyPayload.name} - ${role}`,
                sal_lpa: Number(data.sal_lpa || data.package_lpa || 6.5),
                role_for: role,
                is_internship: Boolean(data.is_internship || /intern/i.test(role))
            };
            const drive = await driveRepository.create(drivePayload);

            const criteriaPayload = {
                elg_id: elgId,
                drive_id: driveId,
                sem: Number(data.sem || 7),
                allowed_branch: data.allowed_branch || "CSE,CSE(AI),ECE,EE(VD&T),EEE,Mech",
                min_cgpa: Number(data.min_cgpa || 7.0),
                max_backlog: Number(data.max_backlog || 0),
                min_sslc: Number(data.min_sslc ?? data.sslc_percentage ?? 60),
                min_puc: Number(data.min_puc ?? data.puc_percentage ?? 60)
            };
            const criteria = await eligibilityRepository.create(criteriaPayload);

            createdDrives.push({
                ...drive,
                criteria
            });
        }

        return {
            ...createdCompany,
            drives: createdDrives
        };
    },

    async updateCompany(companyId, updates) {
        await this.getCompanyById(companyId);

        const payload = {};
        if (updates.name !== undefined) payload.name = updates.name?.trim();
        if (updates.email !== undefined) payload.email = updates.email?.trim();
        if (updates.roles_offered !== undefined) payload.roles_offered = updates.roles_offered?.trim();
        if (updates.type !== undefined) payload.type = updates.type?.trim();

        return companyRepository.update(companyId, payload);
    },

    async deleteCompany(companyId) {
        await this.getCompanyById(companyId);

        // Strict safety check: verify no placement drives reference this company
        const drives = await driveRepository.findByCompanyId(companyId);
        if (drives && drives.length > 0) {
            const err = new Error(
                `Cannot delete company '${companyId}': it is referenced by ${drives.length} placement drive(s). Remove or reassign the drives first.`
            );
            err.statusCode = 409;
            throw err;
        }

        // Verify no placement history records reference this company
        const history = await placementHistoryRepository.getAll();
        const referencedInHistory = history.filter(h => h.company_id === companyId);
        if (referencedInHistory.length > 0) {
            const err = new Error(
                `Cannot delete company '${companyId}': it is referenced by ${referencedInHistory.length} placement history record(s).`
            );
            err.statusCode = 409;
            throw err;
        }

        return companyRepository.delete(companyId);
    }
};

module.exports = companyService;
