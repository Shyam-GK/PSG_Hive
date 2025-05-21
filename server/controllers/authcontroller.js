const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();
const pool = require('../config/db');
const {
  findUserByEmail,
  findAdminByEmail,
  updateUserOTP,
  updateAdminOTP,
  updateUserPassword,
  updateAdminPassword,
} = require("../models/User");

const sendEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error.message, error.stack);
    throw new Error("Failed to send email: " + error.message);
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const email = username;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    let user = await findUserByEmail(email);
    let role;

    if (user) {
      role = user.role;
      console.log('User found in Users table:', user.email, 'Role:', role);
    } else {
      user = await findAdminByEmail(email);
      role = "admin";
      console.log('User found in Admin table:', user.email, 'Role:', role);
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const id = user.user_id || user.adm_id;
    const token = jwt.sign(
      { id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'None',
      maxAge: 3600 * 1000,
      path: '/',
    });

    console.log(`JWT Cookie set for user ${id}, role: ${role}`);

    if (role === "faculty") {
      if (!pool) {
        console.error("Database pool is undefined in login function");
        return res.status(500).json({ success: false, message: "Database pool is not initialized" });
      }
      const facultyId = user.user_id;
      if (!facultyId) {
        console.error("Faculty ID is undefined for user:", user);
        return res.status(400).json({ success: false, message: "Faculty ID is missing" });
      }
      const clubQuery = 'SELECT club_id, club_name FROM public."Clubs" WHERE faculty_advisor = $1';
      console.log('Executing club query for facultyId:', facultyId);
      try {
        const { rows } = await pool.query(clubQuery, [facultyId]);
        console.log('Club query result:', rows);
        if (rows.length > 0) {
          const club = rows[0];
          res.cookie('faculty_club', JSON.stringify({
            club_id: club.club_id,
            club_name: club.club_name
          }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            maxAge: 3600 * 1000,
            path: '/',
          });
          console.log(`Faculty club cookie set: club_id=${club.club_id}, club_name=${club.club_name}`);
        } else {
          console.log(`No club found for faculty member: ${facultyId}`);
          res.cookie('faculty_club', JSON.stringify({ hasClub: false }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            maxAge: 3600 * 1000,
            path: '/',
          });
        }
      } catch (dbErr) {
        console.error("Error executing club query:", dbErr.message, dbErr.stack);
        return res.status(500).json({ success: false, message: "Failed to fetch faculty club: " + dbErr.message });
      }
    }

    console.log('Final role being sent:', role);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message, err.stack);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getFacultyClub = async (req, res) => {
  try {
    console.log('Cookies received in getFacultyClub:', req.cookies);
    const facultyClubCookie = req.cookies.faculty_club;
    if (!facultyClubCookie) {
      console.log('No faculty_club cookie found for user');
      return res.status(200).json({
        success: true,
        hasClub: false,
        message: "No club assigned to this faculty member.",
      });
    }

    let clubData;
    try {
      clubData = JSON.parse(facultyClubCookie);
    } catch (err) {
      console.error('Error parsing faculty_club cookie:', err.message, err.stack);
      return res.status(400).json({ success: false, message: "Invalid faculty club data." });
    }

    if (clubData.hasClub === false) {
      return res.status(200).json({
        success: true,
        hasClub: false,
        message: "No club assigned to this faculty member.",
      });
    }

    const { club_id, club_name } = clubData;
    if (!club_id || !club_name) {
      console.log('Invalid faculty club data:', clubData);
      return res.status(400).json({ success: false, message: "Invalid faculty club data." });
    }

    return res.status(200).json({
      success: true,
      hasClub: true,
      club_id,
      club_name,
    });
  } catch (error) {
    console.error("Error in getFacultyClub:", error.message, error.stack);
    return res.status(500).json({ success: false, message: "Failed to fetch club information: " + error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('jwt', { path: '/' });
    res.clearCookie('faculty_club', { path: '/' });
    res.clearCookie('isLoggedIn', { path: '/' });
    res.clearCookie('role', { path: '/' });
    res.clearCookie('user_id', { path: '/' });
    console.log('Cookies cleared during logout');
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message, error.stack);
    return res.status(500).json({ success: false, message: "Failed to log out: " + error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    let user = await findUserByEmail(email);
    let role = "user";

    if (!user) {
      user = await findAdminByEmail(email);
      role = "admin";
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (role === "user") {
      await updateUserOTP(user.user_id, otp);
    } else {
      await updateAdminOTP(user.adm_id, otp);
    }

    await sendEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP sending failed:", error.message, error.stack);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }

  try {
    let user = await findUserByEmail(email);
    let role = "user";

    if (!user) {
      user = await findAdminByEmail(email);
      role = "admin";
    }

    console.log("Stored OTP:", user?.otp, "Type:", typeof user?.otp);
    console.log("Provided OTP:", otp, "Type:", typeof otp);

    if (!user || !user.otp) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or no OTP generated" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error.message, error.stack);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Email, OTP, and new password are required" });
    }

    let user = await findUserByEmail(email);
    let role = "user";

    if (!user) {
      user = await findAdminByEmail(email);
      role = "admin";
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.otp) {
      return res.status(400).json({ success: false, message: "OTP already used or expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (role === "user") {
      await updateUserPassword(user.user_id, hashedPassword);
      await updateUserOTP(user.user_id, null);
    } else {
      await updateAdminPassword(user.adm_id, hashedPassword);
      await updateAdminOTP(user.adm_id, null);
    }

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password error:", err.message, err.stack);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getFacultyClub,
  logout,
};