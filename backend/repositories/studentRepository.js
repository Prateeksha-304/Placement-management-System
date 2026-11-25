const supabase = require("../config/supabase");

const studentRepository = {
    async getAll() {
        const response = await supabase.get("/students", {
            params: {
                select: "*"
            }
        });
        return response.data || [];
    },

    async findByUsn(usn) {
        if (!usn) return null;
        const cleanUsn = String(usn).trim();
        const response = await supabase.get("/students", {
            params: {
                select: "*",
                usn: `ilike.${cleanUsn}`
            }
        });
        return response.data?.[0] || null;
    },

    async findByEmail(email) {
        const response = await supabase.get("/students", {
            params: {
                select: "*",
                email: `eq.${email.trim().toLowerCase()}`
            }
        });
        return response.data?.[0] || null;
    },

    async updateStatus(usn, status) {
        if (!usn) return null;
        const cleanUsn = String(usn).trim();
        const response = await supabase.patch("/students", { status }, {
            params: {
                usn: `ilike.${cleanUsn}`
            },
            headers: {
                Prefer: "return=representation"
            }
        });
        return response.data?.[0] || null;
    }
};

module.exports = studentRepository;
