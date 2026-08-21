const express = require('express');
const router = express.Router();
const authMiddleware = require("../../Middleware/authmiddleware");
const { registerUser, loginUser, checkAuth } = require("../Controllers/authcontroller");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/verify", authMiddleware, checkAuth);

module.exports = router;