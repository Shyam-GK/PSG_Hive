const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword, verifyOtp, getFacultyClub, logout } = require('../controllers/AuthController');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/faculty-club', getFacultyClub); // New endpoint
router.post('/logout', logout); // Add this line if not already present

module.exports = router;