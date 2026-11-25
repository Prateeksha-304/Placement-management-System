const express = require("express");
const router = express.Router();
const eligibilityController = require("../controllers/eligibilityController");
const { verifyToken } = require("../config/jwt");
const asyncHandler = require("../utils/asyncHandler");

// Optional auth extractor middleware: if token present, decodes it into req.user
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            req.user = verifyToken(authHeader.split(" ")[1]);
        } catch {
            // Let handler or downstream proceed or fail gracefully
        }
    }
    next();
}

// GET /students/:usn/eligible-drives
router.get("/:usn/eligible-drives", optionalAuth, asyncHandler(eligibilityController.getEligibleDrives));

module.exports = router;
