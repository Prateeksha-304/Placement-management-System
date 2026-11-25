const supabase = require("../config/supabase");

const companyRepository = {
    async getAll() {
        const response = await supabase.get("/company", {
            params: {
                select: "*",
                order: "name.asc"
            }
        });
        return response.data || [];
    },

    async findById(companyId) {
        const response = await supabase.get("/company", {
            params: {
                select: "*",
                company_id: `eq.${companyId}`
            }
        });
        return response.data?.[0] || null;
    },

    async create(data) {
        const response = await supabase.post("/company", data, {
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async update(companyId, updates) {
        const response = await supabase.patch("/company", updates, {
            params: {
                company_id: `eq.${companyId}`
            },
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    },

    async delete(companyId) {
        const response = await supabase.delete("/company", {
            params: {
                company_id: `eq.${companyId}`
            }
        });
        return response.status === 204 || response.status === 200;
    }
};

module.exports = companyRepository;
