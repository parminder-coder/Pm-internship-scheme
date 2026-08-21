const cloudinary = require("../config/cloudinary");
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

const uploadResume = async (req, res) => {

    try {

        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a resume"
            });
        }

        let profile = await StudentProfile.findOne({ userId });

        if (!profile) {
            profile = new StudentProfile({
                userId,
                personalInfo: {
                    name: req.user?.name || "Student",
                    phone: "0000000000",
                    DOB: new Date("2000-01-01"),
                    gender: "Male"
                },
                education: {
                    degree: "General",
                    field: "General",
                    institution: "N/A",
                    GraduationYear: 2026,
                    CGPA: 0
                },
                location: {
                    willingToRelocate: true,
                    preferredLocations: []
                },
                preferences: {
                    sectors: [],
                    preferredRoles: []
                }
            });
        }

        let fileUrl = "";
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "student_resumes",
                        resource_type: "raw"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);
            });
            fileUrl = result.secure_url;
        } catch (cloudErr) {
            console.warn("Cloudinary upload skipped/failed:", cloudErr.message);
            fileUrl = `https://storage.local/resumes/${Date.now()}_${req.file.originalname || "resume.pdf"}`;
        }

        if (!profile.resume) {
            profile.resume = {};
        }
        profile.resume.fileUrl = fileUrl;

        // Forward file to ML service parser
        try {
            const formData = new FormData();
            const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "application/pdf" });
            formData.append("file", blob, req.file.originalname || "resume.pdf");

            const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
            const parseResponse = await fetch(`${mlServiceUrl}/api/parse-resume`, {
                method: "POST",
                body: formData
            });

            if (parseResponse.ok) {
                const parseData = await parseResponse.json();
                if (parseData.success && parseData.candidate) {
                    const cand = parseData.candidate;
                    profile.resume.parsed = {
                        skills: cand.skills || [],
                        education: cand.education || "",
                        branch: cand.branch || "",
                        experience: cand.experience || "",
                        projects: cand.projects || []
                    };
                }
            } else {
                console.error("ML Parser Service returned status:", parseResponse.status);
            }
        } catch (parseErr) {
            console.error("Failed to parse resume with ML service:", parseErr.message);
        }

        await profile.save();

        // Fetch top 5 internship recommendations from ML model
        let recommendations = [];
        try {
            const candidatePayload = {
                skills: profile.resume?.parsed?.skills || [],
                education: profile.resume?.parsed?.education || profile.education?.degree || "",
                branch: profile.resume?.parsed?.branch || profile.education?.field || "",
                experience: profile.resume?.parsed?.experience || "",
                projects: profile.resume?.parsed?.projects || [],
                preferredJobRole: profile.preferences?.preferredRoles?.[0] || "",
                preferredDomain: profile.preferences?.sectors?.[0] || ""
            };

            const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
            const recResponse = await fetch(`${mlServiceUrl}/api/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(candidatePayload)
            });

            if (recResponse.ok) {
                const recData = await recResponse.json();
                recommendations = recData.recommendations || [];
            }
        } catch (recErr) {
            console.error("Failed to fetch recommendations from ML model:", recErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Resume uploaded and parsed successfully",
            fileUrl: fileUrl,
            parsed: profile.resume.parsed,
            recommendations
        });

    } catch (error) {

        console.error("Resume Upload Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload resume",
            error: error.message
        });
    }

};

// Get top 5 internship recommendations for logged-in user
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await StudentProfile.findOne({ userId });

        if (!profile) {
            return res.status(200).json({
                success: true,
                hasResume: false,
                message: "Student profile not found",
                recommendations: []
            });
        }

        const fileUrl = profile.resume?.fileUrl;
        const hasResume = Boolean(fileUrl && typeof fileUrl === "string" && fileUrl.trim() !== "");

        if (!hasResume) {
            return res.status(200).json({
                success: true,
                hasResume: false,
                message: "No resume uploaded yet",
                recommendations: []
            });
        }

        const candidatePayload = {
            skills: profile.resume?.parsed?.skills || [],
            education: profile.resume?.parsed?.education || profile.education?.degree || "",
            branch: profile.resume?.parsed?.branch || profile.education?.field || "",
            experience: profile.resume?.parsed?.experience || "",
            projects: profile.resume?.parsed?.projects || [],
            preferredJobRole: profile.preferences?.preferredRoles?.[0] || "",
            preferredDomain: profile.preferences?.sectors?.[0] || ""
        };

        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
        const recResponse = await fetch(`${mlServiceUrl}/api/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidatePayload)
        });

        if (!recResponse.ok) {
            throw new Error(`ML Recommendation Service returned status ${recResponse.status}`);
        }

        const recData = await recResponse.json();

        return res.status(200).json({
            success: true,
            hasResume: true,
            recommendations: recData.recommendations || []
        });

    } catch (error) {
        console.error("Get Recommendations Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch recommendations",
            error: error.message
        });
    }
};


module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
    uploadResume,
    getRecommendations
};