const express = require('express');
const router = express.Router();
const ClubController = require('../controllers/clubController');

// Specific routes should come before dynamic routes
router.get('/landing', ClubController.getLandingPageClubs);
router.get("/all", ClubController.getAllClubs);
router.get('/:clubId', ClubController.getClubDetails);

module.exports = router;