const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Log to confirm the router is being loaded
console.log("Setting up admin routes...");

// Temporary test route to debug route loading
router.get("/test", (req, res) => {
  console.log("Accessed /admin/test");
  res.status(200).json({ message: "Test route working" });
});

// Existing admin routes
router.post("/login", adminController.loginAdmin);
router.post("/add-faculty", adminController.addFaculty);
router.post("/upload-users", adminController.uploadUsers);
router.get("/club-status", adminController.getClubStatus);
router.put("/update-vacancy/:club_id", adminController.updateMaxVacancy);
router.get("/club-summary", adminController.getClubSummary);
router.get("/users-not-registered", adminController.getUsersNotRegistered);
router.get("/users-allotments", adminController.getUsersAndAllotments);
router.put("/update-advisor-poc/:club_id", adminController.updateClubAdvisorAndPoC);
router.get("/users", adminController.getUsers);

// Routes for registration control
router.get("/passout-years", (req, res, next) => {
  console.log("Accessed /admin/passout-years");
  adminController.getPassoutYears(req, res, next);
});
router.post("/update-registration", adminController.updateRegistration);

module.exports = router;