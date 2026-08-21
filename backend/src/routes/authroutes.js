const express = require('express');
const router = express.Router();
const authMiddleware = require("../../Middleware/authmiddleware");
const { registerUser, loginUser, checkAuth, completeFormStatus } = require("../Controllers/authcontroller");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);
router.get("/verify", authMiddleware, checkAuth);
router.post("/complete-profile", authMiddleware, completeFormStatus);

module.exports = router;