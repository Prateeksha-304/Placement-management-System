const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateToken");
const validateRequest = require("../middleware/validateRequest");
const { validateLogin } = require("../validators/authValidator");
const asyncHandler = require("../utils/asyncHandler");

// Rate limit for authentication: max 15 requests per 5 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 5 minutes.",
        error: "Rate limit exceeded"
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post("/login", loginLimiter, validateRequest(validateLogin), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authenticateToken, asyncHandler(authController.getMe));

module.exports = router;
