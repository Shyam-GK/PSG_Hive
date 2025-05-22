const express = require("express");
const router = express.Router();
const { getLandingPageClubs, getClubDetails, getAllClubs } = require("../controllers/clubController");
const authenticate = require("../middleware/authMiddleware");

console.log("Setting up club routes...");

router.get("/landing", authenticate, getLandingPageClubs);
router.get("/all", authenticate, getAllClubs);
router.get("/details/:clubId", authenticate, getClubDetails);

module.exports = router;