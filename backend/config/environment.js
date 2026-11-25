const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET"];

function validateEnvironment() {
    const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing mandatory environment variables: ${missing.join(", ")}. Please check your .env file.`
        );
    }
}

validateEnvironment();

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5175",
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
    JWT_ISSUER: process.env.JWT_ISSUER || "pms-backend",
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || "pms-app"
};
