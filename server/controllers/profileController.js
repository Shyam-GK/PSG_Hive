const { getStudentProfile: getStudentProfileModel } = require("../models/profileModel");

console.log("Imported profileModel type:", typeof getStudentProfileModel);
console.dir(getStudentProfileModel);
console.log("studentModel module path:", require.resolve("../models/profileModel"));

const getStudentProfile = async (req, res) => {
  console.log("Handling getStudentProfile, params:", req.params);
  try {
    const { studentId } = req.params;
    console.log("Received studentId:", studentId);
    if (!studentId || studentId.trim() === '') {
      console.log("Validation failed: Missing or empty studentId");
      return res.status(400).json({ error: "Missing or empty student_id" });
    }
    const profile = await getStudentProfileModel(studentId);
    console.log("Sending profile response:", profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    if (error.message === "Student not found") {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: `Error fetching student profile: ${error.message}` });
  }
};

module.exports = {
  getStudentProfile,
};