const express = require("express");
const router = express.Router();

const authMiddleware = require("../Middleware/authmiddleware");

const {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile
} = require("../Controllers/formcontroller");

router.post("/student-profile", authMiddleware, createProfile);

router.get("/student-profile", authMiddleware, getProfile);

router.patch("/student-profile", authMiddleware, updateProfile);

router.delete("/student-profile", authMiddleware, deleteProfile);

module.exports = router;