const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginAdmin = async (req, res) => {
  const { adm_id, password } = req.body;

  try {
    if (!adm_id || !password) {
      return res.status(400).json({ success: false, message: "Admin ID and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const result = await pool.query('SELECT * FROM "Admin" WHERE adm_id = $1', [adm_id]);
    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.adm_id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600 * 1000,
      path: "/",
    });

    res.cookie("isLoggedIn", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("role", "admin", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: admin.adm_id, name: admin.name, email: admin.email, role: "admin" },
    });
  } catch (error) {
    console.error("Error in loginAdmin:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const addFaculty = async (req, res) => {
  const { user_id, name, email, password, dept, role } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    if (!user_id || !name || !email || !password || !dept || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (role !== "faculty") {
      return res.status(400).json({ success: false, message: "Role must be 'faculty'" });
    }

    const userCheck = await pool.query(
      'SELECT * FROM "Users" WHERE user_id = $1 OR email = $2',
      [user_id, email]
    );
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ success: false, message: "User ID or email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO "Users" (user_id, name, email, password, dept, role, class, year_of_joining)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, name, email, dept, role;
    `;
    const insertValues = [user_id, name, email, hashedPassword, dept, role, null, null];
    const result = await pool.query(insertQuery, insertValues);

    res.status(201).json({ success: true, message: "Faculty added successfully", faculty: result.rows[0] });
  } catch (error) {
    console.error("Error in addFaculty:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const uploadUsers = async (req, res) => {
  const users = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: "No user data provided" });
    }

    console.log(`Starting user upload process. Total users to process: ${users.length}`);

    const validGenders = ['Male', 'Female'];
    const validResidencyStatuses = ['Hosteller', 'Dayscholar'];
    const saltRounds = 10;
    const failedUsers = [];
    const successfulUsers = [];

    for (const user of users) {
      const { user_id, name, email, password, dept, gender, residency_status, class: userClass, role, year_of_joining } = user;

      // Log 2: For each record, log the user data being processed
      console.log(`Processing user: ${user_id || "unknown"}`, {
        user_id,
        name,
        email,
        password,
        dept,
        gender,
        residency_status,
        class: userClass,
        role,
        year_of_joining
      });

      // Validate required fields
      if (!user_id || !name || !email || !password || !dept || !gender || !residency_status) {
        failedUsers.push({ user_id, error: "Missing required fields" });
        continue;
      }

      // Validate gender and residency_status
      if (!validGenders.includes(gender)) {
        failedUsers.push({ user_id, error: "Invalid gender. Must be 'Male' or 'Female'" });
        continue;
      }
      if (!validResidencyStatuses.includes(residency_status)) {
        failedUsers.push({ user_id, error: "Invalid residency_status. Must be 'Hosteller' or 'Dayscholar'" });
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
        INSERT INTO "Users" (user_id, name, email, password, dept, gender, residency_status, role, class, year_of_joining)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING user_id;
      `;
      const insertValues = [
        user_id,
        name,
        email,
        hashedPassword,
        dept,
        gender,
        residency_status,
        role || "student",
        userClass || null,
        year_of_joining || null,
      ];

      try {
        const result = await pool.query(insertQuery, insertValues);
        successfulUsers.push(result.rows[0].user_id);
      } catch (err) {
        failedUsers.push({ user_id, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: "User upload completed",
      successful: successfulUsers,
      failed: failedUsers,
    });
  } catch (error) {
    console.error("Error in uploadUsers:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const getClubStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
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
    res.status(200).json({ success: true, data: clubs.rows });
  } catch (err) {
    console.error("Error fetching club status:", err.message);
    res.status(500).json({ success: false, message: "Internal server error", details: err.message });
  }
};

const updateMaxVacancy = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const { club_id } = req.params;
    const { max_vacancy } = req.body;

    if (!max_vacancy || max_vacancy <= 0) {
      return res.status(400).json({ success: false, message: "Max vacancy must be a positive integer" });
    }

    const clubResult = await pool.query('SELECT curr_allotment, min_allotment FROM "Clubs" WHERE club_id = $1', [club_id]);
    if (clubResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    const { curr_allotment, min_allotment } = clubResult.rows[0];
    if (max_vacancy < curr_allotment) {
      return res.status(400).json({ success: false, message: "Max vacancy cannot be less than current allotment" });
    }
    if (max_vacancy < min_allotment) {
      return res.status(400).json({ success: false, message: "Max vacancy cannot be less than minimum allotment" });
    }

    const updateResult = await pool.query(
      'UPDATE "Clubs" SET max_vacancy = $1 WHERE club_id = $2 RETURNING *',
      [max_vacancy, club_id]
    );
    res.status(200).json({ success: true, message: "Max vacancy updated successfully", club: updateResult.rows[0] });
  } catch (error) {
    console.error("Error in updateMaxVacancy:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const getClubSummary = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
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
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error in getClubSummary:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const getUsersNotRegistered = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const result = await pool.query(`
      SELECT u.user_id, u.name, u.dept, u.class, u.gender, u.residency_status
      FROM "Users" u
      LEFT JOIN "Registrations" r ON u.user_id = r.student_id
      WHERE r.reg_id IS NULL
      AND u.role = 'student'
      AND u.can_select_clubs = true
      ORDER BY u.dept, u.user_id
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error in getUsersNotRegistered:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const getUsersAndAllotments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const result = await pool.query(`
      SELECT 
        u.user_id, 
        u.name, 
        u.dept, 
        u.gender, 
        u.residency_status, 
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
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error in getUsersAndAllotments:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

const updateClubAdvisorAndPoC = async (req, res) => {
  const { club_id } = req.params;
  const { faculty_advisor, poc, poc_phone } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const clubCheck = await pool.query('SELECT * FROM public."Clubs" WHERE club_id = $1', [club_id]);
    if (clubCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    const userCheck = await pool.query('SELECT * FROM public."Users" WHERE user_id = $1 AND role = $2', [faculty_advisor, 'faculty']);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Faculty Advisor must be a user with role 'faculty'" });
    }

    if (poc_phone) {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(poc_phone)) {
        return res.status(400).json({ success: false, message: "PoC phone number must be a 10-digit number" });
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

    res.status(200).json({ success: true, data: updatedClub.rows[0] });
  } catch (err) {
    console.error("Error updating club advisor and PoC:", err.message);
    res.status(500).json({ success: false, message: "Internal server error", details: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const usersQuery = `
      SELECT user_id, name, dept, class, role
      FROM public."Users"
      WHERE role = 'faculty'
      ORDER BY dept, name;
    `;
    const users = await pool.query(usersQuery);
    console.log("Fetched users for faculty advisor:", users.rows);
    res.status(200).json({ success: true, data: users.rows });
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ success: false, message: "Internal server error", details: err.message });
  }
};

const getJoiningYears = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    const query = `
      SELECT DISTINCT year_of_joining
      FROM "Users"
      WHERE year_of_joining IS NOT NULL AND role = 'student'
      ORDER BY year_of_joining;
    `;
    const result = await pool.query(query);
    const joiningYears = result.rows.map(row => row.year_of_joining);
    res.status(200).json({ success: true, data: joiningYears });
  } catch (err) {
    console.error("Error fetching joining years:", err.message);
    res.status(500).json({ success: false, message: "Internal server error", details: err.message });
  }
};

const updateRegistration = async (req, res) => {
  const { year_of_joining, is_open } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admin role required" });
    }

    if (!year_of_joining || typeof is_open !== 'boolean') {
      return res.status(400).json({ success: false, message: "Year of joining and is_open (boolean) are required" });
    }

    const updateUsersQuery = `
      UPDATE "Users"
      SET can_select_clubs = $1
      WHERE role = 'student' AND year_of_joining = $2;
    `;
    await pool.query(updateUsersQuery, [is_open, year_of_joining]);

    res.status(200).json({ 
      success: true, 
      message: `Registration ${is_open ? 'opened' : 'closed'} for joining year ${year_of_joining}` 
    });
  } catch (err) {
    console.error("Error updating registration:", err.message);
    res.status(500).json({ success: false, message: "Internal server error", details: err.message });
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
  getJoiningYears,
  updateRegistration,
};