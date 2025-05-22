const express = require("express");
const router = express.Router();
const { getClubStudents } = require("../controllers/allotmentController");
const authenticate = require("../middleware/authMiddleware"); // Add this

console.log("Imported allotmentController:", { getClubStudents });
console.log("Setting up allotment routes...");

if (!getClubStudents) {
  throw new Error("Missing required methods from allotmentController");
}

router.get("/club/:clubId", authenticate, getClubStudents);

module.exports = router;