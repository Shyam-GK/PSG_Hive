const pool = require('../config/db');

console.log("Pool object:", pool);
console.log("Postgres pool object in model:", typeof pool?.query);

if (typeof pool.query !== 'function') {
  throw new Error('Database pool is not properly initialized. pool.query is not a function.');
}

const getStudentProfile = async (studentId) => {
  if (!studentId) {
    throw new Error("Missing required parameter: studentId");
  }
  try {
    const userQuery = `
      SELECT user_id, name, email, dept, class, gender, residency_status
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
      user_id: userResult.rows[0].user_id,
      name: userResult.rows[0].name ?? 'N/A',
      email: userResult.rows[0].email ?? 'N/A',
      dept: userResult.rows[0].dept ?? 'N/A',
      class: userResult.rows[0].class ?? 'N/A',
      gender: userResult.rows[0].gender ?? 'N/A',
      residency_status: userResult.rows[0].residency_status ?? 'N/A',
      clubs: clubsResult.rows.map(club => ({
        club_id: club.club_id ?? 'N/A',
        club_name: club.club_name ?? 'N/A',
        type: club.type ?? 'N/A',
      })),
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