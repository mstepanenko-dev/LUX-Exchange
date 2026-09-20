const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/change-password", changePassword);

module.exports = router;
