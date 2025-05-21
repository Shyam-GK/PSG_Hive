const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Admin login
const loginAdmin = async (req, res) => {
  const { adm_id, password } = req.body;

  try {
    if (!adm_id || !password) {
      return res.status(400).json({ error: "Admin ID and password are required" });
    }

    const result = await pool.query('SELECT * FROM "Admin" WHERE adm_id = $1', [adm_id]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.cookie("isLoggedIn", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("role", "admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      admin: { adm_id: admin.adm_id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Error in loginAdmin:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Add a new faculty member
const addFaculty = async (req, res) => {
  const { user_id, name, email, password, dept, role } = req.body;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const userRole = req.cookies.role;

    if (!isLoggedIn || userRole !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user_id || !name || !email || !password || !dept || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (role !== "faculty") {
      return res.status(400).json({ error: "Role must be 'faculty'" });
    }

    const userCheck = await pool.query(
      'SELECT * FROM "Users" WHERE user_id = $1 OR email = $2',
      [user_id, email]
    );
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ error: "User ID or email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO "Users" (user_id, name, email, password, dept, role, class)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, name, email, dept, role;
    `;
    const insertValues = [user_id, name, email, hashedPassword, dept, role, null];
    const result = await pool.query(insertQuery, insertValues);

    res.status(201).json({ message: "Faculty added successfully", faculty: result.rows[0] });
  } catch (error) {
    console.error("Error in addFaculty:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Bulk upload users from CSV/Excel
const uploadUsers = async (req, res) => {
  const users = req.body;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "No user data provided" });
    }

    const saltRounds = 10;
    const failedUsers = [];
    const successfulUsers = [];

    for (const user of users) {
      const { user_id, name, email, password, dept, class: userClass, role, passout_year } = user;

      if (!user_id || !name || !email || !password || !dept) {
        failedUsers.push({ user_id, error: "Missing required fields" });
        continue;
      }

      const userCheck = await pool.query(
        'SELECT * FROM "Users" WHERE user_id = $1 OR email = $2',
        [user_id, email]
      );
      if (userCheck.rowCount > 0) {
        failedUsers.push({ user_id, error: "User ID or email already exists" });
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO "Users" (user_id, name, email, password, dept, role, class, passout_year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING user_id;
      `;
      const insertValues = [
        user_id,
        name,
        email,
        hashedPassword,
        dept,
        role || "student",
        userClass || null,
        passout_year || null,
      ];

      try {
        const result = await pool.query(insertQuery, insertValues);
        successfulUsers.push(result.rows[0].user_id);
      } catch (err) {
        failedUsers.push({ user_id, error: err.message });
      }
    }

    res.status(200).json({
      message: "User upload completed",
      successful: successfulUsers,
      failed: failedUsers,
    });
  } catch (error) {
    console.error("Error in uploadUsers:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get real-time club status (seats left)
const getClubStatus = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
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
      ORDER BY club_name;
    `;
    const clubs = await pool.query(query);
    res.status(200).json(clubs.rows);
  } catch (err) {
    console.error("Error fetching club status:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Update max vacancy for a club
const updateMaxVacancy = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { club_id } = req.params;
    const { max_vacancy } = req.body;

    if (!max_vacancy || max_vacancy <= 0) {
      return res.status(400).json({ error: "Max vacancy must be a positive integer" });
    }

    const clubResult = await pool.query('SELECT curr_allotment, min_allotment FROM "Clubs" WHERE club_id = $1', [club_id]);
    if (clubResult.rowCount === 0) {
      return res.status(404).json({ error: "Club not found" });
    }

    const { curr_allotment, min_allotment } = clubResult.rows[0];
    if (max_vacancy < curr_allotment) {
      return res.status(400).json({ error: "Max vacancy cannot be less than current allotment" });
    }
    if (max_vacancy < min_allotment) {
      return res.status(400).json({ error: "Max vacancy cannot be less than minimum allotment" });
    }

    const updateResult = await pool.query(
      'UPDATE "Clubs" SET max_vacancy = $1 WHERE club_id = $2 RETURNING *',
      [max_vacancy, club_id]
    );
    res.status(200).json({ message: "Max vacancy updated successfully", club: updateResult.rows[0] });
  } catch (error) {
    console.error("Error in updateMaxVacancy:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get club summary (total available and allocated, sorted by name)
const getClubSummary = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(`
      SELECT 
        club_id, 
        club_name, 
        max_vacancy AS total_available, 
        curr_allotment AS total_allocated,
        (max_vacancy - curr_allotment) AS seats_left
      FROM "Clubs"
      ORDER BY club_name
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getClubSummary:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get list of users not registered (sorted by dept and roll no)
const getUsersNotRegistered = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(`
      SELECT u.user_id, u.name, u.dept, u.class
      FROM "Users" u
      LEFT JOIN "Registrations" r ON u.user_id = r.student_id
      WHERE r.reg_id IS NULL
      ORDER BY u.dept, u.user_id
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getUsersNotRegistered:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Get users and their allotments
const getUsersAndAllotments = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(`
      SELECT 
        u.user_id, 
        u.name, 
        u.dept, 
        c.club_id, 
        c.club_name, 
        a.type, 
        a.status, 
        a.alloted_at
      FROM "Allotment" a
      JOIN "Users" u ON a.student_id = u.user_id
      JOIN "Clubs" c ON a.club_id = c.club_id
      ORDER BY u.dept, u.user_id, a.type
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getUsersAndAllotments:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Update club's faculty advisor and PoC
const updateClubAdvisorAndPoC = async (req, res) => {
  const { club_id } = req.params;
  const { faculty_advisor, poc, poc_phone } = req.body;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const clubCheck = await pool.query('SELECT * FROM public."Clubs" WHERE club_id = $1', [club_id]);
    if (clubCheck.rows.length === 0) {
      return res.status(404).json({ error: "Club not found" });
    }

    const userCheck = await pool.query('SELECT * FROM public."Users" WHERE user_id = $1 AND role = $2', [faculty_advisor, 'faculty']);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "Faculty Advisor must be a user with role 'faculty'" });
    }

    if (poc_phone) {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(poc_phone)) {
        return res.status(400).json({ error: "PoC phone number must be a 10-digit number" });
      }
    }

    const updateQuery = `
      UPDATE public."Clubs"
      SET faculty_advisor = $1, poc = $2, poc_phone = $3
      WHERE club_id = $4
      RETURNING *;
    `;
    const updateValues = [faculty_advisor, poc || null, poc_phone || null, club_id];
    const updatedClub = await pool.query(updateQuery, updateValues);

    res.status(200).json(updatedClub.rows[0]);
  } catch (err) {
    console.error("Error updating club advisor and PoC:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get list of users with role = 'faculty' for faculty advisor selection
const getUsers = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const usersQuery = `
      SELECT user_id, name, dept, class, role
      FROM public."Users"
      WHERE role = 'faculty'
      ORDER BY dept, name;
    `;
    const users = await pool.query(usersQuery);
    console.log("Fetched users for faculty advisor:", users.rows);
    res.status(200).json(users.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Get distinct passout years for registration control
const getPassoutYears = async (req, res) => {
  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = `
      SELECT DISTINCT passout_year
      FROM "Users"
      WHERE passout_year IS NOT NULL AND role = 'student'
      ORDER BY passout_year;
    `;
    const result = await pool.query(query);
    const passoutYears = result.rows.map(row => row.passout_year);
    res.status(200).json(passoutYears);
  } catch (err) {
    console.error("Error fetching passout years:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// Update registration (open/close for a specific passout year)
const updateRegistration = async (req, res) => {
  const { passout_year, is_open } = req.body;

  try {
    const isLoggedIn = req.cookies.isLoggedIn;
    const role = req.cookies.role;

    if (!isLoggedIn || role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!passout_year || typeof is_open !== 'boolean') {
      return res.status(400).json({ error: "Passout year and is_open (boolean) are required" });
    }

    // Update can_select_clubs for students with the selected passout year
    const updateUsersQuery = `
      UPDATE "Users"
      SET can_select_clubs = $1
      WHERE role = 'student' AND passout_year = $2;
    `;
    await pool.query(updateUsersQuery, [is_open, passout_year]);

    res.status(200).json({ message: `Registration ${is_open ? 'opened' : 'closed'} for passout year ${passout_year}` });
  } catch (err) {
    console.error("Error updating registration:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

module.exports = {
  loginAdmin,
  addFaculty,
  uploadUsers,
  getClubStatus,
  updateMaxVacancy,
  getClubSummary,
  getUsersNotRegistered,
  getUsersAndAllotments,
  updateClubAdvisorAndPoC,
  getUsers,
  getPassoutYears,
  updateRegistration,
};