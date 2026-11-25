const supabase = require("../config/supabase");

const userRepository = {
    /**
     * Find user role record by email
     * @param {string} email 
     */
    async findByEmail(email) {
        const response = await supabase.get("/user_roles", {
            params: {
                select: "*",
                email: `eq.${email.trim().toLowerCase()}`
            }
        });
        return response.data?.[0] || null;
    },

    /**
     * Find user role record by Supabase user_id
     * @param {string} userId 
     */
    async findByUserId(userId) {
        const response = await supabase.get("/user_roles", {
            params: {
                select: "*",
                user_id: `eq.${userId}`
            }
        });
        return response.data?.[0] || null;
    },

    /**
     * Get all users in user_roles
     */
    async getAll() {
        const response = await supabase.get("/user_roles", {
            params: {
                select: "*"
            }
        });
        return response.data || [];
    }
};

module.exports = userRepository;
