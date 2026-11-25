const axios = require("axios");
const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const supabase = axios.create({
    baseURL: `${process.env.SUPABASE_URL}/rest/v1`,

    headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Profile": "public",
        "Content-Profile": "public"
    },

    timeout: 30000
});

// Global response logging
supabase.interceptors.response.use(
    (response) => {
        console.log(
            `Supabase SUCCESS | ${response.config.url} | Status: ${response.status} | Rows: ${
                Array.isArray(response.data) ? response.data.length : "N/A"
            }`
        );

        return response;
    },

    (error) => {
        console.error("SUPABASE ERROR:");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Message:", error.message);
        }

        return Promise.reject(error);
    }
);

module.exports = supabase;