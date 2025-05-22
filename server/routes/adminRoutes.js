const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");

console.log("Setting up admin routes...");

router.get("/test", (req, res) => {
  console.log("Accessed /admin/test");
  res.status(200).json({ success: true, message: "Test route working" });
});

// Protected routes
router.post("/add-faculty", authenticate, adminController.addFaculty);
router.post("/upload-users", authenticate, adminController.uploadUsers);
router.get("/club-status", authenticate, adminController.getClubStatus);
router.put("/update-vacancy/:club_id", authenticate, adminController.updateMaxVacancy);
router.get("/club-summary", authenticate, adminController.getClubSummary);
router.get("/users-not-registered", authenticate, adminController.getUsersNotRegistered);
router.get("/users-allotments", authenticate, adminController.getUsersAndAllotments);
router.put("/update-advisor-poc/:club_id", authenticate, adminController.updateClubAdvisorAndPoC);
router.get("/users", authenticate, adminController.getUsers);
router.get("/joining-years", authenticate, adminController.getJoiningYears);
router.post("/update-registration", authenticate, adminController.updateRegistration);

module.exports = router;