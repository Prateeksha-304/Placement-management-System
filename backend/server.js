const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, ".env") });
const env = require("./config/environment");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const driveExpirationService = require("./services/driveExpirationService");

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Health check / home route (Preserved)
app.get("/", (req, res) => {
    res.json({
        message: "Placement Management System Backend Running",
        version: "2.0.0",
        environment: env.NODE_ENV
    });
});

// Authentication Routes
app.use("/auth", require("./routes/authRoutes"));

// Preserved Existing API Endpoints & Extended Layered Routes
app.use("/companies", require("./routes/companyRoutes"));
app.use("/drives", require("./routes/driveRoutes"));

// Students & Eligibility
app.use("/students", require("./routes/eligibilityRoutes"));
app.use("/students", require("./routes/studentRoutes"));

// Applications & Notifications
app.use("/applications", require("./routes/applicationRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

// Role-specific Workspaces
app.use("/officer", require("./routes/officerRoutes"));
app.use("/coordinator", require("./routes/coordinatorRoutes"));

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${PORT}`);
        // Start recurring drive deadline expiration job
        driveExpirationService.startScheduledJob(60000);
    });
}

module.exports = app;
