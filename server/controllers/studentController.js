const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken'); 

const { v4: uuidv4 } = require('uuid');

// Helper function to generate 10-character UUID
const generateShortUUID = () => {
  return uuidv4().replace(/-/g, '').substring(0, 10);
};


// Student login
const loginStudent = async (req, res) => {
  const { user_id, password } = req.body;

  try {
    if (!user_id || !password) {
      return res.status(400).json({ error: "User ID and password are required" });
    }

    const result = await pool.query('SELECT * FROM "Users" WHERE user_id = $1', [user_id]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (user.role !== "student") {
      return res.status(403).json({ error: "Only students can log in here" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.cookie("isLoggedIn", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.cookie("role", "student", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.cookie("user_id", user.user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    console.log(`Cookies set for user ${user.user_id}: isLoggedIn=true, role=student, user_id=${user.user_id}`);

    res.status(200).json({
      user: { user_id: user.user_id, name: user.name, email: user.email, dept: user.dept },
    });
  } catch (error) {
    console.error("Error in loginStudent:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get club list for registration
const getClubList = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    console.log(`Cookies received in getClubList: isLoggedIn=${isLoggedIn}, role=${role}`);

    if (!isLoggedIn || role !== "student") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = `
      SELECT 
        club_id, 
        club_name, 
        max_vacancy, 
        min_allotment, 
        curr_allotment, 
        (max_vacancy - curr_allotment) AS seats_left,
        faculty_advisor,
        poc,
        poc_phone
      FROM public."Clubs"
      WHERE max_vacancy > curr_allotment
      ORDER BY club_name;
    `;
    const clubs = await pool.query(query);
    res.status(200).json(clubs.rows);
  } catch (err) {
    console.error("Error fetching club list:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;
    const user_id = req.cookies.user_id;

    if (!isLoggedIn || role !== "student") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userQuery = 'SELECT user_id, passout_year, can_select_clubs FROM "Users" WHERE user_id = $1 AND role = \'student\'';
    const userResult = await pool.query(userQuery, [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    const regQuery = 'SELECT * FROM "Registrations" WHERE student_id = $1';
    const regResult = await pool.query(regQuery, [user_id]);
    const hasRegistered = regResult.rowCount > 0;

    res.status(200).json({
      hasRegistered,
      canSelectClubs: user.can_select_clubs,
      userPassoutYear: user.passout_year,
      canRegister: user.can_select_clubs && !hasRegistered,
    });
  } catch (err) {
    console.error("Error fetching registration status:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Submit preferences


const submitPreferences = async (req, res) => {
  const { preferences } = req.body;
  
  try {
    // 1. Authentication
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });
    
    // 2. Token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student_id = decoded.id;
    const role = decoded.role;
    
    if (role !== "student") {
      return res.status(401).json({ error: "Unauthorized: Only students can submit preferences" });
    }

    // 3. Input Validation
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({ error: "Preferences array is required and must not be empty" });
    }

    // 4. Check User Status
    const userResult = await pool.query(
      'SELECT can_select_clubs FROM "Users" WHERE user_id = $1 AND role = \'student\'', 
      [student_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { can_select_clubs } = userResult.rows[0];
    if (!can_select_clubs) {
      return res.status(403).json({ 
        error: "Registration is closed. You cannot modify preferences anymore."
      });
    }

    // 5. Begin Transaction
    await pool.query('BEGIN');

    try {
      // 6. Delete existing records (child table first)
      await pool.query('DELETE FROM "Allotment" WHERE student_id = $1', [student_id]);
      await pool.query('DELETE FROM "Registrations" WHERE student_id = $1', [student_id]);

      // 7. Calculate deadline (7 days from now)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      // 8. Insert new registrations and collect reg_ids
      const regIds = [];
      for (let i = 0; i < preferences.length; i++) {
        const reg_id = uuidv4().replace(/-/g, '').substring(0, 10); // 10-char UUID
        const club_id = preferences[i];
        const pref_value = i + 1;

        // Verify club exists
        const clubCheck = await pool.query(
          'SELECT 1 FROM "Clubs" WHERE club_id = $1', 
          [club_id]
        );
        
        if (clubCheck.rowCount === 0) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: `Club with ID ${club_id} does not exist` });
        }

        // Insert registration
        await pool.query(
          `INSERT INTO "Registrations" 
          (reg_id, student_id, club_id, pref_value, reg_at, deadline) 
          VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [reg_id, student_id, club_id, pref_value, deadline]
        );
        regIds.push({ reg_id, club_id });
      }

      // 9. Insert into Allotment table with all required columns
      for (let i = 0; i < regIds.length; i++) {
        const { reg_id, club_id } = regIds[i];
        const allotment_id = uuidv4().replace(/-/g, '').substring(0, 10); // 10-char UUID
        
        await pool.query(
          `INSERT INTO "Allotment" 
          ( reg_id, student_id, club_id, alloted_at, status, type) 
          VALUES ($1, $2, $3,  NOW(), $4, $5)`,
          [
            //allotment_id,
            reg_id,
            student_id,
            club_id,
            'Active', // Initial status
            i === 0 ? 'Primary' : 'Associate' // First preference is Primary
          ]
        );
      }

      // 10. Update user status
      await pool.query(
        'UPDATE "Users" SET can_select_clubs = false WHERE user_id = $1',
        [student_id]
      );

      // 11. Commit transaction
      await pool.query('COMMIT');
      res.status(200).json({ message: "Preferences and allotments updated successfully" });
      
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error("Database error details:", {
        message: err.message,
        query: err.query,
        parameters: err.parameters
      });
      res.status(500).json({ 
        error: "Database operation failed",
        details: err.message
      });
    }
  } catch (err) {
    console.error("Error in submitPreferences:", err);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }
};


// Get student's preferences
const getPreferences = async (req, res) => {
  const student_id = req.cookies.user_id;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "student") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = `
      SELECT r.pref_value, r.club_id, c.club_name
      FROM "Registrations" r
      JOIN "Clubs" c ON r.club_id = c.club_id
      WHERE r.student_id = $1
      ORDER BY r.pref_value;
    `;
    const preferences = await pool.query(query, [student_id]);
    res.status(200).json(preferences.rows);
  } catch (err) {
    console.error("Error fetching preferences:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get student's allotment
const getAllotment = async (req, res) => {
  const student_id = req.cookies.user_id;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "student") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = `
      SELECT a.club_id, c.club_name, a.type, a.status, a.alloted_at
      FROM "Allotment" a
      JOIN "Clubs" c ON a.club_id = c.club_id
      WHERE a.student_id = $1
      ORDER BY a.alloted_at DESC;
    `;
    const allotment = await pool.query(query, [student_id]);
    res.status(200).json(allotment.rows);
  } catch (err) {
    console.error("Error fetching allotment:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

module.exports = {
  loginStudent,
  getClubList,
  getRegistrationStatus,
  submitPreferences,
  getPreferences,
  getAllotment,
};