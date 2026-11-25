const supabase = require("../config/supabase");

const eligibilityRepository = {
    async getAll() {
        const response = await supabase.get("/eligibility_criteria", {
            params: {
                select: "*"
            }
        });
        return response.data || [];
    },

    async findByDriveId(driveId) {
        const response = await supabase.get("/eligibility_criteria", {
            params: {
                select: "*",
                drive_id: `eq.${driveId}`
            }
        });
        return response.data?.[0] || null;
    },

    async create(data) {
        const response = await supabase.post("/eligibility_criteria", data, {
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async updateByDriveId(driveId, updates) {
        const response = await supabase.patch("/eligibility_criteria", updates, {
            params: {
                drive_id: `eq.${driveId}`
            },
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async deleteByDriveId(driveId) {
        const response = await supabase.delete("/eligibility_criteria", {
            params: {
                drive_id: `eq.${driveId}`
            }
        });
        return response.status === 204 || response.status === 200;
    }
};

module.exports = eligibilityRepository;
