const supabase = require("../config/supabase");

const applicationRepository = {
    async getAll(filters = {}) {
        const params = {
            select: "*",
            order: "date.desc"
        };

        if (filters.status && filters.status !== "All") {
            params.status = `eq.${filters.status}`;
        }
        if (filters.usn) {
            params.usn = `eq.${filters.usn}`;
        }
        if (filters.drive_id) {
            params.drive_id = `eq.${filters.drive_id}`;
        }

        const response = await supabase.get("/application", { params });
        return response.data || [];
    },

    async findById(appId) {
        const response = await supabase.get("/application", {
            params: {
                select: "*",
                app_id: `eq.${appId}`
            }
        });
        return response.data?.[0] || null;
    },

    async findByUsn(usn) {
        const response = await supabase.get("/application", {
            params: {
                select: "*",
                usn: `ilike.${usn}`,
                order: "date.desc"
            }
        });
        return response.data || [];
    },

    async findByUsnAndDrive(usn, driveId) {
        const response = await supabase.get("/application", {
            params: {
                select: "*",
                usn: `ilike.${usn}`,
                drive_id: `eq.${driveId}`
            }
        });
        return response.data?.[0] || null;
    },

    async create(data) {
        const response = await supabase.post("/application", data, {
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async updateStatus(appId, status, changedBy, statusDate = new Date().toISOString().split("T")[0]) {
        const response = await supabase.patch(
            "/application",
            {
                status,
                status_changed_by: changedBy,
                status_date: statusDate
            },
            {
                params: {
                    app_id: `eq.${appId}`
                },
                headers: {
                    Prefer: "return=representation"
                }
            }
        );
        return response.data?.[0] || null;
    }
};

module.exports = applicationRepository;
