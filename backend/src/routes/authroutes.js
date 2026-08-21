const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser } = require("../Controllers/authcontroller");
router.post("/login", loginUser);

router.post("/register", registerUser);
router.post("/logout", logoutUser);

module.exports = router;