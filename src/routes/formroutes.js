const express = require("express");
const router = express.Router();
const upload = require("../Middleware/uploadmiddleware");
const authMiddleware = require("../Middleware/authmiddleware");

const {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
    uploadResume
} = require("../Controllers/formcontroller");

router.post("/student-profile", authMiddleware, createProfile);

router.get("/student-profile", authMiddleware, getProfile);

router.patch("/student-profile", authMiddleware, updateProfile);

router.delete("/student-profile", authMiddleware, deleteProfile);
router.post(
    "/student-profile/resume",
    authMiddleware,
    upload.single("resume"),
    uploadResume
);

module.exports = router;