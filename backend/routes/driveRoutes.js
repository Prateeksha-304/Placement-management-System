const express = require("express");
const router = express.Router();
const driveController = require("../controllers/driveController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const validateRequest = require("../middleware/validateRequest");
const { validateDrive } = require("../validators/driveValidator");
const asyncHandler = require("../utils/asyncHandler");

// GET /drives - List all placement drives
router.get("/", asyncHandler(driveController.getAll));

// GET /drives/:id
router.get("/:id", asyncHandler(driveController.getById));

// Placement Officer management endpoints
router.post(
    "/",
    authenticateToken,
    authorizeRole("placement_officer"),
    validateRequest(validateDrive),
    asyncHandler(driveController.create)
);

router.patch(
    "/:id",
    authenticateToken,
    authorizeRole("placement_officer"),
    asyncHandler(driveController.update)
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("placement_officer"),
    asyncHandler(driveController.delete)
);

module.exports = router;
