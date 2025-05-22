const { getStudentProfile: getStudentProfileModel } = require("../models/profileModel");

const getStudentProfile = async (req, res) => {
  console.log("Handling getStudentProfile, user:", req.user);
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log("Received studentId:", studentId, "userId:", userId, "role:", userRole);

    if (!studentId || studentId.trim() === '') {
      console.log("Validation failed: Missing or empty studentId");
      return res.status(400).json({ error: "Missing or empty student_id" });
    }

    // Validate studentId format (alphanumeric, underscores, hyphens, max 50 chars)
    const studentIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    if (!studentIdRegex.test(studentId)) {
      console.log("Validation failed: Invalid studentId format");
      return res.status(400).json({ error: "Invalid student_id format" });
    }

    if (userRole !== "admin" && userId.toLowerCase() !== studentId.toLowerCase()) {
      console.log("Access denied: User can only view their own profile or admin required");
      return res.status(403).json({ error: "Forbidden: You can only view your own profile" });
    }

    const profile = await getStudentProfileModel(studentId);
    const normalizedProfile = {
      user_id: profile.user_id,
      student_id: profile.user_id,
      name: profile.name ?? 'N/A',
      email: profile.email ?? 'N/A',
      dept: profile.dept ?? 'N/A',
      class: profile.class ?? 'N/A',
      clubs: Array.isArray(profile.clubs) ? profile.clubs : [],
    };
    console.log("Sending profile response:", normalizedProfile);
    res.status(200).json(normalizedProfile);
  } catch (error) {
    console.error("Error in getStudentProfile:", error.message, error.stack);
    if (error.message === "Student not found") {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: `Error fetching student profile: ${error.message}` });
  }
};

module.exports = {
  getStudentProfile,
};