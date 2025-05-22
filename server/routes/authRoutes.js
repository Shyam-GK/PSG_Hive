const express = require("express");
const router = express.Router();
const { login, forgotPassword, resetPassword, verifyOtp, getFacultyClub, logout } = require("../controllers/authcontroller");
const authenticate = require("../middleware/authMiddleware"); // Add this

// Unprotected routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/faculty-club", authenticate, getFacultyClub);
router.post("/logout", authenticate, logout);

module.exports = router;