const express = require("express");
const router = express.Router();

const {
    signupUser,
    loginUser,
    updatePassword,
    resetPassword,
    verifyUserEmail,
} = require("../controllers/authController");
const { authenticateUser } = require("../services/authService");

router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/update-password/:uniqueId", updatePassword);
router.get("/verify-email/:token", verifyUserEmail);
router.post("/reset-password", resetPassword);

module.exports = router;
