const express = require("express");
const router = express.Router();
const { getStudentProfile } = require("../controllers/profileController");

router.get("/:studentId", getStudentProfile);

module.exports = router;
