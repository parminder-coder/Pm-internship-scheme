const StudentProfile = require("../models/form");
const createProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const existingProfile = await StudentProfile.findOne({ userId });

        if (existingProfile) {
            return res.status(409).json({
                success: false,
                message: "Student profile already exists"
            });
        }
        const {
            personalInfo,
            education,
            location,
            preferences
        } = req.body;

        if (!personalInfo || !education || !location || !preferences) {
            return res.status(400).json({
                success: false,
                message: "Please provide all profile details"
            });
        }

        // Create profile
        const profile = await StudentProfile.create({
            userId,
            personalInfo,
            education,
            location,
            preferences
        });

        return res.status(201).json({
            success: true,
            message: "Student profile created successfully",
            profile
        });

    } catch (error) {
        console.error("Create Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create student profile",
            error: error.message
        });
    }
};


// Get logged-in user's profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await StudentProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            profile
        });

    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: error.message
        });
    }
};


// Update logged-in user's profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await StudentProfile.findOneAndUpdate(
            { userId },
            { $set: req.body },
            {
                new: true,
                runValidators: true
            }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student profile updated successfully",
            profile
        });

    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
};


// Delete logged-in user's profile
const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await StudentProfile.findOneAndDelete({
            userId
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student profile deleted successfully"
        });

    } catch (error) {
        console.error("Delete Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete profile",
            error: error.message
        });
    }
};


module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile
};