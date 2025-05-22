const express = require("express");
const router = express.Router();
const { 
  loginStudent, 
  getStudentProfile, 
  getClubList, 
  getRegistrationStatus, 
  submitPreferences, 
  getPreferences, 
  getAllotment 
} = require("../controllers/studentController");
const authenticate = require("../middleware/authMiddleware");

console.log("Setting up student routes...");

// Unprotected route
router.post("/login", loginStudent);

// Protected routes
router.get("/me", authenticate, getStudentProfile);
router.get("/available-clubs", authenticate, getClubList);
router.get("/registration-status", authenticate, getRegistrationStatus);
router.post("/register-club", authenticate, submitPreferences);
router.get("/preferences", authenticate, getPreferences);
router.get("/allotment", authenticate, getAllotment);

module.exports = router;