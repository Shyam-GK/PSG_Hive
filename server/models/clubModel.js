const { Pool } = require('pg');
const redisClient = require('../config/redis');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "club_registration",
  password: "shyam",
  port: 5432,
});

class ClubModel {
  //fetch and cache clubs with Redis
  static async fetchAndCacheClubs(query, cacheKey, ttl = 300) {
    try {
      const cachedClubs = await redisClient.get(cacheKey);
      if (cachedClubs) {
        return JSON.parse(cachedClubs);
      }

      const { rows } = await pool.query(query);
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(rows));
      return rows;
    } catch (error) {
      throw new Error(`Error fetching clubs: ${error.message}`);
    }
  }

  // Get 3 random clubs
  static async getLandingPageClubs() {
    const query = `
      SELECT club_id, club_name, description
      FROM public."Clubs"
      ORDER BY RANDOM()
      LIMIT 3;
    `;
    return this.fetchAndCacheClubs(query, 'clubs:landing', 300);
  }

  // Get details of a specific club by club_id
  static async getClubDetails(clubId) {
    const cacheKey = `club:${clubId}`;
    try {
      const cachedClub = await redisClient.get(cacheKey);
      if (cachedClub) {
        return JSON.parse(cachedClub);
      }

      const query = `
        SELECT club_id, club_name,description,max_vacancy,min_allotment,faculty_advisor,poc,poc_phone,curr_allotment
        FROM public."Clubs"
        WHERE club_id = $1;
      `;
      const { rows } = await pool.query(query, [clubId]);
      if (rows.length === 0) {
        return null;
      }
      await redisClient.setEx(cacheKey, 300, JSON.stringify(rows[0]));
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching club details: ${error.message}`);
    }
  }

  static async getAllClubs() {
    const query = `SELECT club_id, club_name FROM public."Clubs";`;
    console.log('Starting getAllClubs');
    try {
      const result = await this.fetchAndCacheClubs(query, 'clubs:all', 300);
      console.log('getAllClubs result:', result);
      return result;
    } catch (error) {
      console.error('getAllClubs error:', error.stack);
      throw error;
    }
  }
}

module.exports = ClubModel;