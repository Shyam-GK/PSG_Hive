const { getClubStudents: getClubStudentsModel } = require("../models/allotmentModel");

console.log("Imported allotmentModel:", { getClubStudentsModel });
console.log("allotmentModel module path:", require.resolve("../models/allotmentModel"));

const getClubStudents = async (req, res) => {
  console.log("Handling getClubStudents:", req.params);
  try {
    const { clubId } = req.params;
    if (!clubId || typeof clubId !== "string" || clubId.trim() === "") {
      return res.status(400).json({ error: "Invalid or missing club_id" });
    }
    const students = await getClubStudentsModel(clubId);
    if (!students || students.length === 0) {
      return res.status(404).json({ error: "No students found for this club" });
    }
    res.status(200).json(students);
  } catch (error) {
    console.error("Error in getClubStudents:", error.message, error.stack);
    res.status(500).json({ error: `Error fetching club students: ${error.message}` });
  }
};

module.exports = {
  getClubStudents,
};