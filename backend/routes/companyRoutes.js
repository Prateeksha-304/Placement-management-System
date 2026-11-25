const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRole = require("../middleware/authorizeRole");
const validateRequest = require("../middleware/validateRequest");
const { validateCompany } = require("../validators/companyValidator");
const asyncHandler = require("../utils/asyncHandler");

// GET /companies - List all companies (accessible for drives, student preview, and existing tests)
router.get("/", asyncHandler(companyController.getAll));

// GET /companies/:id
router.get("/:id", asyncHandler(companyController.getById));

// Placement Officer management endpoints
router.post(
    "/",
    authenticateToken,
    authorizeRole("placement_officer"),
    validateRequest(validateCompany),
    asyncHandler(companyController.create)
);

router.patch(
    "/:id",
    authenticateToken,
    authorizeRole("placement_officer"),
    asyncHandler(companyController.update)
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("placement_officer"),
    asyncHandler(companyController.delete)
);

module.exports = router;
