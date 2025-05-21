const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "club_registration",
  password: "shyam",
  port: 5432,
});

console.log("Pool object:", pool);
console.log("Postgres pool object in model:", typeof pool?.query);

const getStudentProfile = async (studentId) => {
  if (!studentId) {
    throw new Error("Missing required parameter: studentId");
  }
  try {
    // Fetch student details
    const userQuery = `
      SELECT user_id, name, email, dept, class
      FROM public."Users"
      WHERE user_id ILIKE $1;
    `;
    const userValues = [studentId];
    console.log(
      "Executing getStudentProfile user query:",
      userQuery,
      userValues
    );
    let userResult;
    try {
      userResult = await pool.query(userQuery, userValues);
    } catch (dbErr) {
      console.error("userQuery failed:", dbErr);
      throw dbErr;
    }

    if (!userResult.rows[0]) {
      throw new Error("Student not found");
    }

    // Fetch club memberships
    const clubsQuery = `
      SELECT 
        c.club_id,
        c.club_name,
        a.type
      FROM public."Allotment" a
      JOIN public."Clubs" c ON a.club_id = c.club_id
      WHERE a.student_id ILIKE $1 AND a.status = 'Active';
    `;
    const clubsValues = [studentId];
    console.log(
      "Executing getStudentProfile clubs query:",
      clubsQuery,
      clubsValues
    );
    let clubsResult;
    try {
      clubsResult = await pool.query(clubsQuery, clubsValues);
    } catch (dbErr) {
      console.error("clubQuery failed:", dbErr);
      throw dbErr;
    }

    const profile = {
      ...userResult.rows[0],
      clubs: clubsResult.rows,
    };
    console.log("getStudentProfile result:", profile);
    return profile;
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    throw error;
  }
};

module.exports = {
  getStudentProfile,
};