const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");

// Authenticated student views own profile & placement status
router.get("/me/placement-status", authenticateToken, authorizeRole("student"), asyncHandler(studentController.getPlacementStatus));
router.get("/me", authenticateToken, authorizeRole("student"), asyncHandler(studentController.getMyProfile));

// Officers and coordinators can check a student's placement status
router.get(
    "/:usn/placement-status",
    authenticateToken,
    authorizeRole("placement_officer", "placement_coordinator"),
    asyncHandler(studentController.getPlacementStatus)
);

// Officers and coordinators can view all students
router.get(
    "/",
    authenticateToken,
    authorizeRole("placement_officer", "placement_coordinator"),
    asyncHandler(studentController.getAllStudents)
);

// Get student details by USN
router.get(
    "/:usn",
    authenticateToken,
    authorizeRole("placement_officer", "placement_coordinator", "student"),
    asyncHandler(studentController.getStudentByUsn)
);

module.exports = router;
