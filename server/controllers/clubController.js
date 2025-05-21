const pool = require("../config/db");

const getLandingPageClubs = async (req, res) => {
  try {
    const query = `
      SELECT 
        club_id, 
        club_name, 
        description
      FROM public."Clubs"
      ORDER BY club_name;
    `;
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      const mockClubs = [
        { club_id: 1, club_name: "Robotics Club", description: "Explore robotics and automation." },
        { club_id: 2, club_name: "Music Club", description: "Join us for musical events and performances." },
        { club_id: 3, club_name: "Drama Club", description: "Unleash your acting skills." },
      ];
      return res.status(200).json(mockClubs);
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getLandingPageClubs:", error.message, error.stack);
    const mockClubs = [
      { club_id: 1, club_name: "Robotics Club", description: "Explore robotics and automation." },
      { club_id: 2, club_name: "Music Club", description: "Join us for musical events and performances." },
      { club_id: 3, club_name: "Drama Club", description: "Unleash your acting skills." },
    ];
    res.status(200).json(mockClubs);
  }
};

// ... (getClubDetails function)
const getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;
    const query = `
        SELECT club_id, club_name,description,max_vacancy,min_allotment,faculty_advisor,poc,poc_phone,curr_allotment
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
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
const getAllClubs = async (req, res) => {
  console.log('Handling getAllClubs');
  try {
    const query = `
      SELECT 
        club_id, 
        club_name,
        description
      FROM public."Clubs"
      ORDER BY club_name;
    `;
    console.log('Executing getAllClubs query:', query);
    const result = await pool.query(query);
    console.log('Query result:', result); // Log the entire result object
    console.log('Rows:', result.rows); // Log the rows specifically
    // if (!result.rows || result.rows.length === 0) {
    //   return res.status(404).json({ error: 'No clubs found' });
    // }
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching all clubs:', error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch clubs: ${error.message}` });
  }
};
module.exports = {
  getLandingPageClubs,
  getClubDetails,
  getAllClubs,
};