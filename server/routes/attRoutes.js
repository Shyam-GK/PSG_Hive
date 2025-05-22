const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
} = require("../controllers/attcontroller");
const authenticate = require("../middleware/authMiddleware"); // Add this

console.log("Imported attendanceController:", {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
});

console.log("Setting up attendance routes...");
if (!markAttendance || !getEventAttendance || !getUserAttendance) {
  throw new Error("Missing required methods from attendanceController");
}

router.post("/mark", authenticate, markAttendance);
router.get("/event/:eventId", authenticate, getEventAttendance);
router.get("/user/:studentId", authenticate, getUserAttendance);

module.exports = router;