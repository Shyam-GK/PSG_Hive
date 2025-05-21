const express = require('express');
const router = express.Router();
const {
  getLandingPageEvents,
  getAllUpcomingEvents,
  getAllEvents,
  getClubEvents,
  getClubName,
  addEvent,
} = require('../controllers/eventController');

console.log('Imported eventController:', {
  getLandingPageEvents,
  getAllUpcomingEvents,
  getAllEvents,
  getClubEvents,
  getClubName,
  addEvent,
});

console.log('Setting up event routes...');
if (!getClubEvents || !getClubName || !addEvent) {
  throw new Error('Missing required methods from eventController');
}

router.get('/landing', getLandingPageEvents);
router.get('/upcoming', getAllUpcomingEvents);
router.get('/all', getAllEvents);
router.get('/club/:clubId', getClubEvents);
router.get('/club-name/:clubId', getClubName);
router.post('/add', addEvent);

module.exports = router;