const express = require("express");
const router = express.Router();
const { getStudentProfile } = require("../controllers/profileController");
const authenticate = require("../middleware/authMiddleware");

console.log("Setting up profile routes...");

router.get("/:studentId", authenticate, getStudentProfile);

module.exports = router;