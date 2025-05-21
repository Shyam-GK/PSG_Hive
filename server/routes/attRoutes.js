const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
} = require("../controllers/attcontroller");

console.log("Imported attendanceController:", {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
});

console.log("Setting up attendance routes...");
if (!markAttendance || !getEventAttendance || !getUserAttendance) {
  throw new Error("Missing required methods from attendanceController");
}

router.post("/mark", markAttendance);
router.get("/event/:eventId", getEventAttendance);
router.get("/user/:studentId", getUserAttendance);

module.exports = router;
