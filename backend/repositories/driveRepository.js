const supabase = require("../config/supabase");

const VALID_DRIVE_COLUMNS = [
    "drive_id",
    "company_id",
    "name",
    "sal_lpa",
    "role_for",
    "is_internship",
    "status"
];

function sanitizeDrivePayload(payload) {
    const sanitized = {};
    for (const key of VALID_DRIVE_COLUMNS) {
        if (payload[key] !== undefined) {
            sanitized[key] = payload[key];
        }
    }
    return sanitized;
}

const driveRepository = {
    async getAll() {
        const response = await supabase.get("/placement_drives", {
            params: {
                select: "*",
                order: "drive_id.desc"
            }
        });
        return response.data || [];
    },

    async findById(driveId) {
        const response = await supabase.get("/placement_drives", {
            params: {
                select: "*",
                drive_id: `eq.${driveId}`
            }
        });
        return response.data?.[0] || null;
    },

    async findByCompanyId(companyId) {
        const response = await supabase.get("/placement_drives", {
            params: {
                select: "*",
                company_id: `eq.${companyId}`
            }
        });
        return response.data || [];
    },

    async create(data) {
        const payload = sanitizeDrivePayload(data);
        const response = await supabase.post("/placement_drives", payload, {
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async update(driveId, updates) {
        const payload = sanitizeDrivePayload(updates);
        if (Object.keys(payload).length === 0) {
            return await this.findById(driveId);
        }
        const response = await supabase.patch("/placement_drives", payload, {
            params: {
                drive_id: `eq.${driveId}`
            },
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async delete(driveId) {
        const response = await supabase.delete("/placement_drives", {
            params: {
                drive_id: `eq.${driveId}`
            }
        });
        return response.status === 204 || response.status === 200;
    }
};

module.exports = driveRepository;
