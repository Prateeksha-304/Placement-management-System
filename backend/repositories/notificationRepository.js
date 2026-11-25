const supabase = require("../config/supabase");

const notificationRepository = {
    async getAll() {
        const response = await supabase.get("/notification", {
            params: {
                select: "*",
                order: "sent_at.desc"
            }
        });
        return response.data || [];
    },

    async findByUsn(usn) {
        const response = await supabase.get("/notification", {
            params: {
                select: "*",
                usn: `eq.${usn}`,
                order: "sent_at.desc"
            }
        });
        return response.data || [];
    },

    async findById(nId) {
        const response = await supabase.get("/notification", {
            params: {
                select: "*",
                n_id: `eq.${nId}`
            }
        });
        return response.data?.[0] || null;
    },

    async create(data) {
        const response = await supabase.post("/notification", data, {
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async markRead(nId) {
        const response = await supabase.patch(
            "/notification",
            { read_status: "Read" },
            {
                params: {
                    n_id: `eq.${nId}`
                },
                headers: {
                    Prefer: "return=representation"
                }
            }
        );
        return response.data?.[0] || null;
    },

    async markAllReadForUsn(usn) {
        const response = await supabase.patch(
            "/notification",
            { read_status: "Read" },
            {
                params: {
                    usn: `eq.${usn}`
                },
                headers: {
                    Prefer: "return=representation"
                }
            }
        );
        return response.data || [];
    }
};

module.exports = notificationRepository;
