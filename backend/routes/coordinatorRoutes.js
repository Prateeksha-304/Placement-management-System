const express = require("express");
const router = express.Router();
const coordinatorController = require("../controllers/coordinatorController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");

// Protect coordinator routes (allow both coordinator and officer to view placement records)
router.use(authenticateToken);

router.get("/dashboard", authorizeRole("placement_coordinator"), asyncHandler(coordinatorController.getDashboard));
router.get("/metrics", authorizeRole("placement_coordinator"), asyncHandler(coordinatorController.getDashboard));
router.get("/reports", authorizeRole("placement_coordinator"), asyncHandler(coordinatorController.getReports));
router.get("/placements", authorizeRole("placement_coordinator", "placement_officer"), asyncHandler(coordinatorController.getPlacements));
router.patch("/placement-history/:id", authorizeRole("placement_coordinator", "placement_officer"), asyncHandler(coordinatorController.updatePlacementHistory));

module.exports = router;
