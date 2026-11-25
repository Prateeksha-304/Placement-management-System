const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const validateRequest = require("../middleware/validateRequest");
const { validateApply, validateStatusUpdate } = require("../validators/applicationValidator");
const asyncHandler = require("../utils/asyncHandler");

// Student endpoints
router.post(
    "/",
    authenticateToken,
    authorizeRole("student"),
    validateRequest(validateApply),
    asyncHandler(applicationController.apply)
);

router.get(
    "/my",
    authenticateToken,
    authorizeRole("student"),
    asyncHandler(applicationController.getMyApplications)
);

// Placement Officer & Coordinator review endpoints
router.get(
    "/",
    authenticateToken,
    authorizeRole("placement_officer", "placement_coordinator"),
    asyncHandler(applicationController.getAll)
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRole("placement_officer", "placement_coordinator"),
    asyncHandler(applicationController.getById)
);

router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRole("placement_officer"),
    validateRequest(validateStatusUpdate),
    asyncHandler(applicationController.updateStatus)
);

module.exports = router;
