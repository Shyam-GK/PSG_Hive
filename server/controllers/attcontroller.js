const {
  markAttendance: markAttendanceModel,
  getEventAttendance: getEventAttendanceModel,
  getUserAttendance: getUserAttendanceModel,
} = require("../models/attModel");

console.log("Imported attendanceModel:", {
  markAttendanceModel,
  getEventAttendanceModel,
  getUserAttendanceModel,
});
console.log("attendanceModel module path:", require.resolve("../models/attModel"));

const markAttendance = async (req, res) => {
  console.log("Handling markAttendance, request body:", req.body);
  try {
    const { event_id, student_id, attendance } = req.body;
    if (!event_id || !student_id || !attendance) {
      const missingFields = [];
      if (!event_id) missingFields.push("event_id");
      if (!student_id) missingFields.push("student_id");
      if (!attendance) missingFields.push("attendance");
      console.log("Missing fields:", missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }
    const result = await markAttendanceModel(event_id, student_id, attendance);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in markAttendance:", error.message, error.stack);
    if (error.message.includes("does not exist")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: `Error marking attendance: ${error.message}` });
  }
};

const getEventAttendance = async (req, res) => {
  console.log("Handling getEventAttendance:", req.params, req.query);
  try {
    const { eventId } = req.params;
    const { clubId } = req.query;
    if (!eventId || !clubId) {
      return res.status(400).json({ error: "Missing event_id or club_id" });
    }
    const attendance = await getEventAttendanceModel(eventId, clubId);
    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ error: "No attendance records found for this event and club" });
    }
    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error in getEventAttendance:", error.message, error.stack);
    res.status(500).json({ error: `Error fetching event attendance: ${error.message}` });
  }
};

const getUserAttendance = async (req, res) => {
  console.log("Handling getUserAttendance, params:", req.params, "query:", req.query);
  try {
    const { studentId } = req.params;
    const { clubId } = req.query;
    console.log("Received studentId:", studentId, "clubId:", clubId);
    if (!studentId || studentId.trim() === '') {
      console.log("Validation failed: Missing or empty studentId");
      return res.status(400).json({ error: "Missing or empty student_id" });
    }
    if (!clubId || clubId.trim() === '') {
      console.log("Validation failed: Missing or empty clubId");
      return res.status(400).json({ error: "Missing or empty club_id" });
    }
    const attendance = await getUserAttendanceModel(studentId, clubId);
    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ error: "No attendance records found for this student in the club" });
    }
    console.log("Sending attendance response:", attendance);
    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error in getUserAttendance:", error.message, error.stack);
    res.status(500).json({ error: `Error fetching student attendance: ${error.message}` });
  }
};

module.exports = {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
};