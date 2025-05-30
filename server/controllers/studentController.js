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

    // Generate JWT
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set JWT cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    console.log(`JWT cookie set for user ${user.user_id}: jwt=${token}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user.user_id, name: user.name, email: user.email, dept: user.dept, role: user.role },
    });
  } catch (error) {
    console.error("Error in loginStudent:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get club list for registration
const getClubList = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: Student role required" });
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
    console.log("Club list fetched:", clubs.rows);
    res.status(200).json(clubs.rows);
  } catch (err) {
    console.error("Error fetching club list:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const user_id = req.user.id;
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: Student role required" });
    }

    const userQuery = 'SELECT user_id, year_of_joining, can_select_clubs FROM "Users" WHERE user_id = $1 AND role = \'student\'';
    const userResult = await pool.query(userQuery, [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    const regQuery = 'SELECT * FROM "Registrations" WHERE student_id = $1';
    const regResult = await pool.query(regQuery, [user_id]);
    const hasRegistered = regResult.rowCount > 0;

    console.log("Registration status:", { hasRegistered, canSelectClubs: user.can_select_clubs });
    res.status(200).json({
      hasRegistered,
      canSelectClubs: user.can_select_clubs ?? true, // Fallback if column missing
      userPassoutYear: user.year_of_joining,
      canRegister: (user.can_select_clubs ?? true),
    });
  } catch (err) {
    console.error("Error fetching registration status:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Submit preferences
const submitPreferences = async (req, res) => {
  const { preferences } = req.body;
  const maxClubsAllowed = 1; // Changed from 3 to 1

  try {
    const student_id = req.user.id;
    console.log("Submitting preferences for student:", student_id, "Preferences:", preferences);
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: Student role required" });
    }

    // Input Validation
    if (!Array.isArray(preferences) || preferences.length !== maxClubsAllowed) {
      return res.status(400).json({ error: `Exactly ${maxClubsAllowed} club preference is required` });
    }

    // Check User Status
    const userResult = await pool.query(
      'SELECT can_select_clubs FROM "Users" WHERE user_id = $1 AND role = \'student\'',
      [student_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const can_select_clubs = userResult.rows[0].can_select_clubs ?? true;
    console.log("Can select clubs:", can_select_clubs);
    if (!can_select_clubs) {
      return res.status(403).json({
        error: "Registration is closed. You cannot modify preferences anymore."
      });
    }

    // Begin Transaction
    await pool.query('BEGIN');

    try {
      // Delete existing records
      console.log("Deleting existing Allotment and Registrations for student:", student_id);
      await pool.query('DELETE FROM "Allotment" WHERE student_id = $1', [student_id]);
      await pool.query('DELETE FROM "Registrations" WHERE student_id = $1', [student_id]);

      // Calculate deadline (7 days from now)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      // Insert new registrations and collect reg_ids
      const regIds = [];
      for (let i = 0; i < preferences.length; i++) {
        const reg_id = generateShortUUID();
        const club_id = preferences[i];
        const pref_value = i + 1; // Will be 1 for single club

        // Verify club exists
        const clubCheck = await pool.query(
          'SELECT club_name FROM "Clubs" WHERE club_id = $1',
          [club_id]
        );

        if (clubCheck.rowCount === 0) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: `Club with ID ${club_id} does not exist` });
        }
        console.log(`Club ${club_id} (${clubCheck.rows[0].club_name}) verified`);

        // Insert registration
        console.log(`Inserting registration: reg_id=${reg_id}, club_id=${club_id}, pref_value=${pref_value}`);
        await pool.query(
          `INSERT INTO "Registrations" 
          (reg_id, student_id, club_id, pref_value, reg_at, deadline) 
          VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [reg_id, student_id, club_id, pref_value, deadline]
        );
        regIds.push({ reg_id, club_id });
        break; // Process only one club
      }

      // Insert into Allotment table
      for (let i = 0; i < regIds.length; i++) {
        const { reg_id, club_id } = regIds[i];
        const type = i === 0 ? 'Primary' : 'Associate'; // Primary for single club, Associate logic kept
        console.log(`Inserting allotment: reg_id=${reg_id}, club_id=${club_id}, type=${type}`);
        await pool.query(
          `INSERT INTO "Allotment" 
          (reg_id, student_id, club_id, alloted_at, status, type) 
          VALUES ($1, $2, $3, NOW(), $4, $5)`,
          [reg_id, student_id, club_id, 'Active', type]
        );
      }

      // Update user status
      console.log("Updating user can_select_clubs to false for student:", student_id);
      await pool.query(
        'UPDATE "Users" SET can_select_clubs = false WHERE user_id = $1',
        [student_id]
      );

      // Commit transaction
      await pool.query('COMMIT');
      console.log("Preferences and allotments updated successfully for student:", student_id);
      res.status(200).json({ message: "Preferences and allotments updated successfully" });

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error("Database error in submitPreferences:", {
        message: err.message,
        query: err.query,
        parameters: err.parameters,
        stack: err.stack
      });
      res.status(500).json({
        error: "Database operation failed",
        details: err.message
      });
    }
  } catch (err) {
    console.error("Error in submitPreferences:", err.message, err.stack);
    res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
};

// Get student's preferences
const getPreferences = async (req, res) => {
  const student_id = req.user.id;

  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: Student role required" });
    }

    const query = `
      SELECT r.pref_value, r.club_id, c.club_name
      FROM "Registrations" r
      JOIN "Clubs" c ON r.club_id = c.club_id
      WHERE r.student_id = $1
      ORDER BY r.pref_value;
    `;
    const preferences = await pool.query(query, [student_id]);
    console.log("Preferences fetched:", preferences.rows);
    res.status(200).json(preferences.rows);
  } catch (err) {
    console.error("Error fetching preferences:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get student's allotment
const getAllotment = async (req, res) => {
  const student_id = req.user.id;

  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: Student role required" });
    }

    const query = `
      SELECT a.club_id, c.club_name, a.type, a.status, a.alloted_at
      FROM "Allotment" a
      JOIN "Clubs" c ON a.club_id = c.club_id
      WHERE a.student_id = $1
      ORDER BY a.alloted_at DESC;
    `;
    const allotment = await pool.query(query, [student_id]);
    console.log("Allotment fetched:", allotment.rows);
    res.status(200).json(allotment.rows);
  } catch (err) {
    console.error("Error fetching allotment:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get student profile
const getStudentProfile = async (req, res) => {
  console.log("Handling getStudentProfile, user:", req.user);
  try {
    const studentId = req.user.id;
    console.log("Fetching profile for studentId:", studentId);

    // Fetch student details
    const userQuery = `
      SELECT user_id, name, email, dept, class
      FROM public."Users"
      WHERE user_id ILIKE $1;
    `;
    const userResult = await pool.query(userQuery, [studentId]);

    if (!userResult.rows[0]) {
      return res.status(404).json({ error: "Student not found" });
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
    const clubsResult = await pool.query(clubsQuery, [studentId]);

    const profile = {
      ...userResult.rows[0],
      student_id: userResult.rows[0].user_id,
      clubs: clubsResult.rows,
    };

    console.log("Sending profile response:", profile);
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in getStudentProfile:", error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch profile: ${error.message}` });
  }
};

module.exports = {
  getStudentProfile,
  loginStudent,
  getClubList,
  getRegistrationStatus,
  submitPreferences,
  getPreferences,
  getAllotment,
};