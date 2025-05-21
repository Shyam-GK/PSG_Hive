const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const studentController = require("../controllers/studentController");

// Log to confirm the router is being loaded
console.log("Setting up student routes...");

router.get('/me', async (req, res) => {
  console.log("Accessed /student/me");
  try {
    // Get user data from JWT token instead of cookies
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }
    
    // Verify and decode the JWT token
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
    
    const user_id = decoded.id;
    const role = decoded.role;
    
    console.log(`Token decoded in /student/me: role=${role}, user_id=${user_id}`);

    let user;
    if (role === 'admin') {
      const query = 'SELECT adm_id AS user_id, name, email FROM "Admin" WHERE adm_id = $1';
      const result = await pool.query(query, [user_id]);
      user = result.rows[0];
      if (!user) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
      return res.status(200).json({
        student_id: user.user_id,
        name: user.name,
        email: user.email,
        role: 'admin',
      });
    } else {
      const query = 'SELECT user_id, name, email, dept, role, passout_year, can_select_clubs FROM "Users" WHERE user_id = $1';
      const result = await pool.query(query, [user_id]);
      user = result.rows[0];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({
        student_id: user.user_id,
        name: user.name,
        email: user.email,
        dept: user.dept,
        role: user.role,
        passout_year: user.passout_year,
        can_select_clubs: user.can_select_clubs,
      });
    }
  } catch (err) {
    console.error('Error fetching user details:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post("/login", studentController.loginStudent);
router.get("/available-clubs", studentController.getClubList);
router.get("/registration-status", studentController.getRegistrationStatus);
router.post("/register-club", studentController.submitPreferences);
router.get("/preferences", studentController.getPreferences);
router.get("/allotment", studentController.getAllotment);

module.exports = router;