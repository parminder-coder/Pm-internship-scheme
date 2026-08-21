import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { performLogout } from "../features/useLoggedInSlice";
import { getRecommendationsApi, uploadResumeApi } from "../api/auth";
import {
    Bell,
    MapPin,
    Clock3,
    ChevronDown,
    Sparkles,
    BriefcaseBusiness,
    UserRound,
    LogOut,
    X,
    UploadCloud,
} from "lucide-react";

import "./dashboard.css";

// Fallback internship data
const internships = [
    {
        id: 1,
        company: "Tata Technologies",
        role: "Software Developer Intern",
        location: "New Delhi",
        duration: "12 Months",
        mode: "On-site",
        stipend: "₹5,000 / month",
        match: 94,
        skills: ["React", "JavaScript", "Node.js", "MongoDB", "Git"],
        logo: "T",
        description: "Join the digital transformation unit at Tata Technologies under the PM Internship Scheme. As a Software Developer Intern, you will work on enterprise public digital infrastructure, scalable web applications, and modular UI components.",
        eligibility: "Students/Graduates in B.Tech, BCA, or B.Sc (Computer Science / IT) with sound fundamentals in web development and data structures.",
        responsibilities: [
            "Develop, test, and maintain responsive front-end user interfaces using React.",
            "Integrate RESTful backend services and collaborate with cross-functional engineering teams.",
            "Write clean, maintainable, and well-documented code adhering to industry standards.",
            "Participate in sprint planning, code reviews, and weekly mentorship sessions."
        ],
        perks: [
            "Govt. DBT stipend allowance of ₹5,000/month",
            "Official Certificate from Tata Technologies & Govt of India",
            "Direct mentorship from senior technical leads",
            "Pre-Placement Offer (PPO) consideration based on performance"
        ],
        vacancies: 15,
        deadline: "28 Feb 2026",
    },
    {
        id: 2,
        company: "ABC Corporation",
        role: "Data Analyst Intern",
        location: "Chandigarh",
        duration: "12 Months",
        mode: "Hybrid",
        stipend: "₹5,000 / month",
        match: 89,
        skills: ["Python", "SQL", "Data Analysis", "Tableau", "Power BI"],
        logo: "A",
        description: "Analyze large-scale operational datasets to extract actionable insights. Assist in developing automated dashboards and statistical reports for business operations and policy analytics.",
        eligibility: "Undergraduates or recent graduates with proficiency in SQL, Python data libraries (Pandas/NumPy), and dashboard visualization tools.",
        responsibilities: [
            "Query and analyze multi-relational database structures using SQL.",
            "Build dynamic visualization dashboards and performance reports using Power BI / Tableau.",
            "Cleanse raw data streams and assist in automated ETL pipelines.",
            "Present data findings and strategic trends to department heads."
        ],
        perks: [
            "Govt. DBT stipend allowance of ₹5,000/month",
            "Hands-on exposure to massive production data pipelines",
            "Industry recognized PM Internship Scheme Certificate",
            "Flexible hybrid work environment"
        ],
        vacancies: 8,
        deadline: "05 Mar 2026",
    },
    {
        id: 3,
        company: "Tech Solutions India",
        role: "AI / ML Intern",
        location: "Bengaluru",
        duration: "12 Months",
        mode: "On-site",
        stipend: "₹5,000 / month",
        match: 86,
        skills: ["Python", "Machine Learning", "TensorFlow", "NLP", "Pandas"],
        logo: "T",
        description: "Contribute to cutting-edge machine learning and natural language processing solutions. Work directly with applied research engineers on model fine-tuning, training datasets, and predictive modeling.",
        eligibility: "Enrolled in or completed degree in Computer Science, Data Science, AI/ML, or Mathematics with strong Python programming fundamentals.",
        responsibilities: [
            "Assist in exploratory data analysis, dataset labeling, and feature engineering.",
            "Train, evaluate, and benchmark deep learning & NLP baseline models.",
            "Package and deploy model inference endpoints for web and mobile interfaces.",
            "Document experimental benchmarks and optimize model inference latency."
        ],
        perks: [
            "Govt. DBT stipend allowance of ₹5,000/month",
            "Access to high-performance GPU compute clusters",
            "Direct research mentorship from AI practitioners",
            "Official Govt. PM Internship Scheme Certificate"
        ],
        vacancies: 10,
        deadline: "12 Mar 2026",
    },
];

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [recommendationsList, setRecommendationsList] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [hasResume, setHasResume] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const dashboardFileInputRef = useRef(null);

    const [userName] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            return user?.name || "Student";
        } catch {
            return "Student";
        }
    });
    const userInitial = userName.charAt(0).toUpperCase();

    const menuRef = useRef(null);

    // Fetch recommendations from backend ML model
    useEffect(() => {
        async function loadRecommendations() {
            try {
                setLoadingRecs(true);
                const userStr = localStorage.getItem("user");
                const userObj = userStr ? JSON.parse(userStr) : null;
                const token = userObj?.token || "";

                const res = await getRecommendationsApi(token);
                if (res.success && res.hasResume !== false) {
                    setHasResume(true);
                    if (Array.isArray(res.recommendations) && res.recommendations.length > 0) {
                        const formatted = res.recommendations.map((rec, index) => {
                            const company = rec.Company_Name || "Company";
                            const role = rec.JobTitles || "Internship Opportunity";
                            const skillsRaw = rec.Skills || [];
                            const skillsArray = Array.isArray(skillsRaw)
                                ? skillsRaw
                                : (typeof skillsRaw === "string" ? skillsRaw.split(",").map(s => s.trim()) : []);

                            return {
                                id: index + 1,
                                company,
                                role,
                                location: rec.Location || "On-site",
                                duration: rec.Duration || "12 Months",
                                mode: rec.Mode || "Full-time",
                                stipend: rec.Stipend || "₹5,000 / month",
                                match: Math.round(rec.similarity_score || 85),
                                skills: skillsArray.length > 0 ? skillsArray : ["Relevant Skills"],
                                logo: company.charAt(0).toUpperCase(),
                                description: rec.Description || "Opportunity under PM Internship Scheme.",
                                eligibility: rec.Eligibility || "Students & Graduates eligible under PM Internship Scheme guidelines.",
                                responsibilities: [
                                    "Work directly on core deliverables and engineering modules.",
                                    "Collaborate with cross-functional technical teams."
                                ],
                                perks: [
                                    "Govt. DBT stipend allowance of ₹5,000/month",
                                    "Official Certificate of Completion",
                                    "Mentorship from industry professionals"
                                ],
                                link: rec.Links || "#"
                            };
                        });
                        setRecommendationsList(formatted);
                    } else {
                        setRecommendationsList(internships);
                    }
                } else {
                    setHasResume(false);
                    setRecommendationsList([]);
                }
            } catch (err) {
                console.warn("Could not load AI recommendations:", err);
                setHasResume(false);
                setRecommendationsList([]);
            } finally {
                setLoadingRecs(false);
            }
        }
        loadRecommendations();
    }, []);

    // Direct inline upload from Dashboard
    const handleDashboardUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setUploadError("Only PDF format resumes are allowed.");
            return;
        }

        try {
            setUploadError("");
            setUploadingResume(true);
            const userStr = localStorage.getItem("user");
            const userObj = userStr ? JSON.parse(userStr) : null;
            const token = userObj?.token || "";

            const res = await uploadResumeApi(file, token);
            if (res.success) {
                setHasResume(true);
                if (Array.isArray(res.recommendations) && res.recommendations.length > 0) {
                    const formatted = res.recommendations.map((rec, index) => {
                        const company = rec.Company_Name || "Company";
                        const role = rec.JobTitles || "Internship Opportunity";
                        const skillsRaw = rec.Skills || [];
                        const skillsArray = Array.isArray(skillsRaw)
                            ? skillsRaw
                            : (typeof skillsRaw === "string" ? skillsRaw.split(",").map(s => s.trim()) : []);

                        return {
                            id: index + 1,
                            company,
                            role,
                            location: rec.Location || "On-site",
                            duration: rec.Duration || "12 Months",
                            mode: rec.Mode || "Full-time",
                            stipend: rec.Stipend || "₹5,000 / month",
                            match: Math.round(rec.similarity_score || 85),
                            skills: skillsArray.length > 0 ? skillsArray : ["Relevant Skills"],
                            logo: company.charAt(0).toUpperCase(),
                            description: rec.Description || "Opportunity under PM Internship Scheme.",
                            eligibility: rec.Eligibility || "Students & Graduates eligible under PM Internship Scheme guidelines.",
                            responsibilities: [
                                "Work directly on core deliverables and engineering modules.",
                                "Collaborate with cross-functional technical teams."
                            ],
                            perks: [
                                "Govt. DBT stipend allowance of ₹5,000/month",
                                "Official Certificate of Completion",
                                "Mentorship from industry professionals"
                            ],
                            link: rec.Links || "#"
                        };
                    });
                    setRecommendationsList(formatted);
                } else {
                    setRecommendationsList(internships);
                }
            }
        } catch (err) {
            console.error("Dashboard Resume Upload Error:", err);
            setUploadError(err.message || "Failed to upload resume.");
        } finally {
            setUploadingResume(false);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    // Handle Escape key to close modals and menu
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsMenuOpen(false);
                setSelectedInternship(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (selectedInternship) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [selectedInternship]);

    const handleOpenProfile = () => {
        setIsMenuOpen(false);
        navigate("/profileSetupForm");
    };

    const handleLogoutClick = async () => {
        setIsMenuOpen(false);
        await dispatch(performLogout());
        navigate("/", { replace: true });
    };

    return (
        <div className="dashboard">

            {/* ================= HEADER ================= */}
            <header className="dashboard-header">
                <div className="brand">
                    <div className="brand-mark">
                        PM
                    </div>

                    <div>
                        <h2>PM Internship</h2>
                        <span>Smart Allocation Portal</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="icon-button" aria-label="Notifications" title="Notifications">
                        <Bell size={19} />
                    </button>

                    {/* Top Right Profile Dropdown Container */}
                    <div className="profile-menu-wrapper" ref={menuRef}>
                        <button
                            className={`profile-button ${isMenuOpen ? "active" : ""}`}
                            onClick={() => setIsMenuOpen((prev) => !prev)}
                            aria-expanded={isMenuOpen}
                            aria-haspopup="true"
                            id="profile-menu-button"
                        >
                            <div className="avatar">
                                {userInitial}
                            </div>

                            <div className="profile-name">
                                <strong>{userName}</strong>
                            </div>

                            <ChevronDown
                                size={16}
                                className={`profile-chevron ${isMenuOpen ? "rotate" : ""}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="profile-dropdown-menu" role="menu" aria-labelledby="profile-menu-button">
                                <div className="menu-user-info">
                                    <div className="avatar small">{userInitial}</div>
                                    <div className="menu-user-details">
                                        <strong>{userName}</strong>
                                    </div>
                                </div>

                                <div className="menu-divider" />

                                <button
                                    className="menu-item"
                                    onClick={handleOpenProfile}
                                    role="menuitem"
                                >
                                    <UserRound size={17} className="menu-icon" />
                                    <span>Profile</span>
                                </button>

                                <button
                                    className="menu-item logout-item"
                                    onClick={handleLogoutClick}
                                    role="menuitem"
                                >
                                    <LogOut size={17} className="menu-icon" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ================= MAIN CONTENT ================= */}
            <main className="dashboard-content">
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="welcome-label">
                            Student Dashboard
                        </div>

                        <h1>
                            Welcome back, {userName}
                            <span> 👋</span>
                        </h1>

                        <p>
                            Discover internship opportunities selected specifically
                            for your skills, interests and preferences under the PM Internship Scheme.
                        </p>

                        <div className="hero-actions">
                            <button
                                className="primary-button"
                                onClick={() => {
                                    document.getElementById("recommendations-section")?.scrollIntoView({ behavior: "smooth" });
                                }}
                            >
                                <BriefcaseBusiness size={17} />
                                Explore Internships
                            </button>

                            <button
                                className="secondary-button"
                            >
                                <UserRound size={17} />
                                View Profile
                            </button>
                        </div>
                    </div>
                </section>

                {/* ================= QUICK STATS ================= */}
                <section className="stats">
                    <div className="stat-item">
                        <div className="stat-icon blue">
                            <Sparkles size={19} />
                        </div>

                        <div>
                            <span>AI Matches</span>
                            <strong>{loadingRecs ? "..." : recommendationsList.length}</strong>
                        </div>
                    </div>
                </section>

                {/* ================= RECOMMENDATIONS ================= */}
                <section className="recommendations" id="recommendations-section">
                    <div className="section-header">
                        <div>
                            <div className="section-title-row">
                                <Sparkles size={19} className="sparkle-icon" />
                                <h2>Recommended for you</h2>
                            </div>

                            <p>
                                AI-powered matches based on your profile and parsed resume.
                            </p>
                        </div>
                    </div>

                    {/* RECOMMENDATION LIST */}
                    <div className="recommendation-list">
                        {loadingRecs ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                                Loading AI recommendations...
                            </div>
                        ) : !hasResume ? (
                            <div className="upload-resume-cta-card">
                                <div className="cta-icon-wrap">
                                    <UploadCloud size={32} />
                                </div>
                                <div className="cta-content">
                                    <h3>Upload your Resume for AI Recommendations</h3>
                                    <p>
                                        Upload your latest resume (PDF) so our AI model can parse your skills and matching experience to recommend the top 5 internship opportunities under the PM Internship Scheme.
                                    </p>
                                    {uploadError && <p className="cta-error">• {uploadError}</p>}
                                </div>
                                <div className="cta-actions">
                                    <input
                                        type="file"
                                        ref={dashboardFileInputRef}
                                        style={{ display: "none" }}
                                        accept=".pdf"
                                        onChange={handleDashboardUpload}
                                    />
                                    <button
                                        className="primary-button cta-upload-btn"
                                        onClick={() => dashboardFileInputRef.current?.click()}
                                        disabled={uploadingResume}
                                    >
                                        {uploadingResume ? (
                                            <>Parsing & Uploading...</>
                                        ) : (
                                            <>
                                                <UploadCloud size={17} />
                                                Upload Resume (PDF)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            recommendationsList.map((internship) => {
                                return (
                                    <article className="internship-card" key={internship.id}>
                                        {/* COMPANY */}
                                        <div className="company-section">
                                            <div className="company-logo">
                                                {internship.logo}
                                            </div>

                                            <div>
                                                <span className="company-name">
                                                    {internship.company}
                                                </span>

                                                <h3>{internship.role}</h3>

                                                <div className="job-details">
                                                    <span>
                                                        <MapPin size={14} />
                                                        {internship.location}
                                                    </span>

                                                    <span>
                                                        <Clock3 size={14} />
                                                        {internship.duration}
                                                    </span>

                                                    <span>
                                                        {internship.mode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SKILLS */}
                                        <div className="skills-section">
                                            <span className="skills-label">
                                                Relevant skills
                                            </span>

                                            <div className="skills">
                                                {internship.skills.slice(0, 3).map((skill) => (
                                                    <span key={skill}>{skill}</span>
                                                ))}
                                                {internship.skills.length > 3 && (
                                                    <span className="more-skill">
                                                        +{internship.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* MATCH */}
                                        <div className="match-section">
                                            <div className="match-top">
                                                <span>AI Match</span>
                                                <strong>{internship.match}%</strong>
                                            </div>

                                            <div className="match-bar">
                                                <div style={{ width: `${internship.match}%` }} />
                                            </div>

                                            <small>Strong match</small>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="card-actions">
                                            <button
                                                className="details-button"
                                                onClick={() => setSelectedInternship(internship)}
                                                id={`view-details-${internship.id}`}
                                            >
                                                View details
                                            </button>

                                            <button
                                                className="apply-button"
                                                onClick={() => {
                                                    if (internship.link && internship.link !== "#") {
                                                        window.open(internship.link, "_blank");
                                                    }
                                                }}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>

            {/* =========================================================
                VIEW DETAILS MODAL (BLUR BACKGROUND)
            ========================================================= */}
            {selectedInternship && (
                <div
                    className="modal-backdrop"
                    onClick={() => setSelectedInternship(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="internship-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* MODAL HEADER */}
                        <div className="modal-header">
                            <div className="modal-header-info">
                                <div className="company-logo modal-logo">
                                    {selectedInternship.logo}
                                </div>
                                <div>
                                    <h2 className="modal-title">{selectedInternship.role}</h2>
                                </div>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setSelectedInternship(null)}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div className="modal-body">
                            {/* HIGHLIGHTS GRID */}
                            <div className="modal-highlights-grid">
                                <div className="highlight-box">
                                    <span className="highlight-label">Monthly Stipend</span>
                                    <strong className="highlight-value text-blue">
                                        {selectedInternship.stipend}
                                    </strong>
                                </div>

                                <div className="highlight-box">
                                    <span className="highlight-label">Location & Mode</span>
                                    <strong className="highlight-value">
                                        {selectedInternship.location} • {selectedInternship.mode}
                                    </strong>
                                </div>

                                <div className="highlight-box">
                                    <span className="highlight-label">Duration</span>
                                    <strong className="highlight-value">
                                        {selectedInternship.duration}
                                    </strong>
                                </div>

                                <div className="highlight-box highlight-match">
                                    <span className="highlight-label">AI Match Score</span>
                                    <strong className="highlight-value text-green">
                                        {selectedInternship.match}% Match
                                    </strong>
                                </div>
                            </div>

                            {/* ABOUT OPPORTUNITY */}
                            <div className="modal-section">
                                <h4 className="modal-section-heading">About the Opportunity</h4>
                                <p className="modal-text">{selectedInternship.description}</p>
                            </div>

                            {/* ELIGIBILITY */}
                            <div className="modal-section">
                                <h4 className="modal-section-heading">Eligibility Criteria</h4>
                                <p className="modal-text">{selectedInternship.eligibility}</p>
                            </div>

                            {/* REQUIRED SKILLS */}
                            <div className="modal-section">
                                <h4 className="modal-section-heading">Required & Relevant Skills</h4>
                                <div className="skills modal-skills">
                                    {selectedInternship.skills.map((skill) => (
                                        <span key={skill} className="modal-skill-pill">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="modal-footer">
                            <button
                                className="modal-secondary-btn"
                                onClick={() => setSelectedInternship(null)}
                            >
                                Close
                            </button>

                            <button
                                className="modal-primary-btn"
                            >
                                <BriefcaseBusiness size={17} />
                                Apply for Internship
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;