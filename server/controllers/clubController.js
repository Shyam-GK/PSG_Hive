const pool = require("../config/db");

const getLandingPageClubs = async (req, res) => {
  try {
    if (!req.user || !["student", "admin", "faculty"].includes(req.user.role)) {
      console.log("Access denied: Invalid or missing user role", req.user?.role);
      return res.status(403).json({ error: "Forbidden: Invalid role" });
    }

    const query = `
      SELECT 
        club_id, 
        club_name, 
        description
      FROM public."Clubs"
      ORDER BY club_name;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getLandingPageClubs:", error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch clubs: ${error.message}` });
  }
};

const getClubDetails = async (req, res) => {
  try {
    if (!req.user || !["student", "admin", "faculty"].includes(req.user.role)) {
      console.log("Access denied: Invalid or missing user role", req.user?.role);
      return res.status(403).json({ error: "Forbidden: Invalid role" });
    }

    const { clubId } = req.params;
    const query = `
      SELECT 
        club_id, 
        club_name,
        description,
        max_vacancy,
        min_allotment,
        faculty_advisor,
        poc,
        poc_phone,
        curr_allotment
      FROM public."Clubs"
      WHERE club_id = $1;
    `;
    const result = await pool.query(query, [clubId]); 

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Club not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error in getClubDetails:", error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch club details: ${error.message}` });
  }
};

const getAllClubs = async (req, res) => {
  console.log("Handling getAllClubs, user:", req.user);
  try {
    if (!req.user || !["student", "admin", "faculty"].includes(req.user.role)) {
      console.log("Access denied: Invalid or missing user role", req.user?.role);
      return res.status(403).json({ error: "Forbidden: Invalid role" });
    }

    const query = `
      SELECT 
        club_id, 
        club_name,
        description
      FROM public."Clubs"
      ORDER BY club_name;
    `;
    console.log("Executing getAllClubs query:", query);
    const result = await pool.query(query);
    console.log("Query result rows:", result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching all clubs:", error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch clubs: ${error.message}` });
  }
};

module.exports = {
  getLandingPageClubs,
  getClubDetails,
  getAllClubs,
};