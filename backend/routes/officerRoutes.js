const express = require("express");
const router = express.Router();
const officerController = require("../controllers/officerController");
const notificationController = require("../controllers/notificationController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");

// Protect all officer routes
router.use(authenticateToken, authorizeRole("placement_officer"));

router.get("/dashboard", asyncHandler(officerController.getDashboard));
router.post("/notices", asyncHandler(notificationController.broadcastNotice));

module.exports = router;
