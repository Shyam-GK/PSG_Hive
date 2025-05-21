const pool = require("../config/db");
const redisClient = require("../config/redis");

const fetchAndCacheStudents = async (query, params, cacheKey, ttl = 300) => {
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const { rows } = await pool.query(query, params);
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(rows));
    return rows;
  } catch (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }
};

const getClubStudents = async (clubId) => {
  try {
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === '') {
      throw new Error("Invalid or missing club_id");
    }
    const query = `
      SELECT a.student_id, u.name
      FROM public."Allotment" a
      JOIN public."Users" u ON a.student_id = u.user_id
      WHERE a.club_id = $1
      ORDER BY a.student_id;
    `;
    const cacheKey = `students:club:${clubId}`;
    return await fetchAndCacheStudents(query, [clubId], cacheKey, 300);
  } catch (error) {
    throw new Error(`Error fetching club students: ${error.message}`);
  }
};

module.exports = {
  getClubStudents,
};