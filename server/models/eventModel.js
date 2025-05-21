const pool = require("../config/db");
const redisClient = require("../config/redis");

const fetchAndCacheEvents = async (query, cacheKey, ttl = 300) => {
  try {
    const cachedEvents = await redisClient.get(cacheKey);
    if (cachedEvents) {
      return JSON.parse(cachedEvents);
    }
    const { rows } = await pool.query(query);
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(rows));
    return rows;
  } catch (error) {
    throw new Error(`Error fetching events: ${error.message}`);
  }
};

const getLandingPageEvents = async () => {
  try {
    const query = `
      SELECT 
        e.event_id, 
        e.club AS club_id, 
        c.club_name, 
        e.start_datetime, 
        e.end_datetime, 
        e.event_name, 
        e.event_desc
      FROM public."Events" e
      JOIN public."Clubs" c ON e.club = c.club_id
      WHERE start_datetime > CURRENT_TIMESTAMP
      ORDER BY RANDOM()
      LIMIT 3;
    `;
    return await fetchAndCacheEvents(query, "events:landing", 300);
  } catch (error) {
    throw new Error(`Error fetching landing page events: ${error.message}`);
  }
};

const getAllUpcomingEvents = async () => {
  try {
    const query = `
      SELECT 
        e.event_id, 
        e.club AS club_id, 
        c.club_name, 
        e.start_datetime, 
        e.end_datetime, 
        e.event_name, 
        e.event_desc
      FROM public."Events" e
      JOIN public."Clubs" c ON e.club = c.club_id
      WHERE start_datetime > CURRENT_TIMESTAMP
      ORDER BY start_datetime ASC;
    `;
    return await fetchAndCacheEvents(query, "events:upcoming", 300);
  } catch (error) {
    throw new Error(`Error fetching upcoming events: ${error.message}`);
  }
};

const getAllEvents = async () => {
  try {
    const query = `
      SELECT 
        e.event_id, 
        e.club AS club_id, 
        c.club_name, 
        e.start_datetime, 
        e.end_datetime, 
        e.event_name, 
        e.event_desc
      FROM public."Events" e
      JOIN public."Clubs" c ON e.club = c.club_id
      ORDER BY start_datetime DESC;
    `;
    return await fetchAndCacheEvents(query, "events:all", 300);
  } catch (error) {
    throw new Error(`Error fetching all events: ${error.message}`);
  }
};

const getClubEvents = async (clubId) => {
  try {
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === '') {
      throw new Error('Invalid or missing club ID');
    }
    const query = `
      SELECT 
        e.event_id, 
        e.club AS club_id, 
        c.club_name, 
        e.start_datetime, 
        e.end_datetime, 
        e.event_name, 
        e.event_desc
      FROM public."Events" e
      JOIN public."Clubs" c ON e.club = c.club_id
      WHERE e.club = $1
      ORDER BY start_datetime;
    `;
    const { rows } = await pool.query(query, [clubId]);
    return rows;
  } catch (error) {
    throw new Error(`Error fetching club events: ${error.message}`);
  }
};

const getClubName = async (clubId) => {
  try {
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === '') {
      throw new Error('Invalid or missing club ID');
    }
    const query = `
      SELECT club_name
      FROM public."Clubs"
      WHERE club_id = $1;
    `;
    const { rows } = await pool.query(query, [clubId]);
    if (!rows || rows.length === 0) {
      throw new Error('Club not found');
    }
    return rows[0].club_name;
  } catch (error) {
    throw new Error(`Error fetching club name: ${error.message}`);
  }
};

const addEvent = async (event) => {
  try {
    const { club, start_datetime, end_datetime, event_name, event_desc } = event;
    const query = `
      INSERT INTO public."Events" (
        club, 
        start_datetime, 
        end_datetime, 
        event_name, 
        event_desc
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [club, start_datetime, end_datetime, event_name, event_desc || null];
    const { rows } = await pool.query(query, values);
    const redisKey = `events:club:${club}`;
    await redisClient.del(redisKey); // Invalidate cache
    return rows[0];
  } catch (error) {
    throw new Error(`Error adding event: ${error.message}`);
  }
};

module.exports = {
  getLandingPageEvents,
  getAllUpcomingEvents,
  getAllEvents,
  getClubEvents,
  getClubName,
  addEvent,
};