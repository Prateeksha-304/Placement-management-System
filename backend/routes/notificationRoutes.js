const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");

// Student endpoints
router.get(
    "/my",
    authenticateToken,
    authorizeRole("student"),
    asyncHandler(notificationController.getMyNotifications)
);

router.patch(
    "/:id/read",
    authenticateToken,
    asyncHandler(notificationController.markRead)
);

router.patch(
    "/read-all",
    authenticateToken,
    authorizeRole("student"),
    asyncHandler(notificationController.markAllRead)
);

// Officer notice broadcasting
router.post(
    "/broadcast",
    authenticateToken,
    authorizeRole("placement_officer"),
    asyncHandler(notificationController.broadcastNotice)
);

module.exports = router;
