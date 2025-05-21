const pool = require("../config/db");
const redisClient = require("../config/redis");

const fetchAndCacheAttendance = async (query, params, cacheKey, ttl = 300) => {
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const { rows } = await pool.query(query, params);
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(rows));
    return rows;
  } catch (error) {
    throw new Error(`Error fetching attendance: ${error.message}`);
  }
};

const markAttendance = async (eventId, studentId, attendance) => {
  try {
    // Validate input
    if (!eventId || !studentId || !attendance) {
      throw new Error("Missing event_id, student_id, or attendance");
    }
    if (!['Present', 'Absent'].includes(attendance)) {
      throw new Error("Invalid attendance value");
    }

    // Ensure eventId is a number (BIGINT)
    const eventIdAsNumber = Number(eventId);
    if (isNaN(eventIdAsNumber)) {
      throw new Error("event_id must be a valid number");
    }

    // Check if event exists
    const eventCheck = await pool.query(
      'SELECT event_id FROM public."Events" WHERE event_id = $1',
      [eventIdAsNumber]
    );
    if (eventCheck.rows.length === 0) {
      throw new Error(`Event with ID ${eventIdAsNumber} does not exist`);
    }

    // Check if student exists
    const studentCheck = await pool.query(
      'SELECT user_id FROM public."Users" WHERE user_id = $1',
      [studentId]
    );
    if (studentCheck.rows.length === 0) {
      throw new Error(`Student with ID ${studentId} does not exist`);
    }

    // Insert or update attendance
    const query = `
      INSERT INTO public."Attendance" (event_id, student_id, attendance)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, student_id)
      DO UPDATE SET attendance = EXCLUDED.attendance
      RETURNING *;
    `;
    const values = [eventIdAsNumber, studentId, attendance];
    const { rows } = await pool.query(query, values);

    // Invalidate Redis cache
    const redisKey = `attendance:event:${eventIdAsNumber}`;
    try {
      await redisClient.del(redisKey);
    } catch (redisError) {
      console.error('Error invalidating Redis cache:', redisError.message);
      // Don't throw; cache failure shouldn't fail the request
    }

    return rows[0];
  } catch (error) {
    throw new Error(`Error marking attendance: ${error.message}`);
  }
};



const getEventAttendance = async (eventId, clubId) => {
  try {
    if (!eventId || !clubId) {
      throw new Error("Missing event_id or club_id");
    }
    const query = `
      SELECT 
        a.att_id,
        a.event_id,
        a.student_id,
        u.name AS student_name,
        a.attendance
      FROM public."Attendance" a
      JOIN public."Users" u ON a.student_id = u.user_id
      JOIN public."Allotment" al ON a.student_id = al.student_id AND al.club_id = $2
      WHERE a.event_id = $1
      ORDER BY a.att_id;
    `;
    const cacheKey = `attendance:event:${eventId}:club:${clubId}`;
    return await fetchAndCacheAttendance(query, [eventId, clubId], cacheKey, 300);
  } catch (error) {
    throw new Error(`Error fetching event attendance: ${error.message}`);
  }
};

const getUserAttendance = async (studentId, clubId) => {
  if (!studentId || !clubId) {
    throw new Error("Missing required parameters: studentId and clubId must be provided");
  }
  try {
    const query = `
      SELECT 
        a.att_id, 
        a.event_id, 
        a.student_id, 
        u.name AS student_name, 
        e.event_name, 
        a.attendance
      FROM public."Attendance" a
      JOIN public."Users" u ON a.student_id = u.user_id
      JOIN public."Events" e ON a.event_id = e.event_id
      JOIN public."Allotment" al ON a.student_id = al.student_id
      WHERE a.student_id = $1 AND al.club_id = $2
      ORDER BY e.start_datetime DESC;
    `;
    const values = [studentId, clubId];
    console.log("Executing getUserAttendance query:", query, values);
    const result = await pool.query(query, values);
    console.log("getUserAttendance result:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Error in getUserAttendance:", error.message, error.stack);
    throw error;
  }
};

module.exports = {
  markAttendance,
  getEventAttendance,
  getUserAttendance,
};