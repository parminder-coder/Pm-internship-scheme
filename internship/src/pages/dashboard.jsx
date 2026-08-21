import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import {
    Bell,
    MapPin,
    Clock3,
    ChevronDown,
    Sparkles,
    CheckCircle2,
    BriefcaseBusiness,
    UserRound,
    LogOut,
    X,
    ShieldCheck,
} from "lucide-react";
import { getRecommendations } from "../api/resume";
import { logout } from "../features/useLoggedInSlice";

import "./dashboard.css";

function Dashboard({ onLogout, onProfile }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [internships, setInternships] = useState([]);
    const [recommendationError, setRecommendationError] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userName] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            return user?.name || "Student";
        } catch {
            return "Student";
        }
    });
    const userInitial = userName.charAt(0).toUpperCase();

    useEffect(() => {
        const storedProfile = JSON.parse(localStorage.getItem("candidateProfile") || "null");
        const parsedResume = storedProfile?.parsedResume;
        const profile = parsedResume || storedProfile || {};
        const parsedFeatures = profile.ml_features || {};
        const candidate = {
            skills: (profile.skills || parsedFeatures.skills || []).map((skill) => typeof skill === "string" ? skill : skill.name).filter(Boolean),
            education: profile.education || parsedFeatures.education || profile.qualification || "",
            branch: profile.branch || parsedFeatures.branch || profile.fieldOfStudy || "",
            experience: profile.experience || parsedFeatures.experience || "",
            projects: profile.projects || parsedFeatures.projects || [],
            preferredJobRole: profile.preferredJobRole || parsedFeatures.preferredJobRole || "",
            preferredDomain: profile.preferredDomain || parsedFeatures.preferredDomain || profile.sectorInterests?.join(", ") || "",
        };

        getRecommendations(candidate)
            .then((results) => setInternships(results.map((internship, index) => {
                const normalizedInternship = {
                    id: `${internship.Company_Name}-${index}`,
                    company: internship.Company_Name,
                    role: internship.JobTitles,
                    location: "Not specified",
                    duration: "Not specified",
                    mode: "Not specified",
                    stipend: internship.Stipend || "Not specified",
                    match: Math.round(internship.similarity_score),
                    skills: internship.Skills.split(",").map((skill) => skill.trim()).filter(Boolean),
                    logo: internship.Company_Name?.charAt(0) || "I",
                    description: internship.Description,
                    eligibility: "See the internship listing for eligibility details.",
                };

                return {
                    ...normalizedInternship,
                    reason: buildRecommendationReason(internship, candidate),
                };
            })))
            .catch((error) => setRecommendationError(error.message));
    }, []);

    const menuRef = useRef(null);

    const buildRecommendationReason = (internship, candidate) => {
        const splitSkills = (skills) => skills
            .flatMap((skill) => String(skill).split(/[\/|&]/))
            .map((skill) => skill.trim())
            .filter(Boolean);

        const normalizeSkill = (skill) => String(skill)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const internshipSkills = (internship.Skills || "")
            .split(",")
            .flatMap((skill) => splitSkills([skill]));

        const candidateSkills = new Set(
            splitSkills(candidate.skills || []).map(normalizeSkill)
        );

        const matchedSkills = internshipSkills.filter((skill) => candidateSkills.has(normalizeSkill(skill)));

        if (matchedSkills.length > 0) {
            return `You are eligible for this internship because your matched skills are ${matchedSkills.slice(0, 3).join(", ")}.`;
        }

        return "You are eligible for this internship because it matches your interest profile and skill development goals.";
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
    };

    const handleLogoutClick = async () => {
        setIsMenuOpen(false);

        try {
            await fetch("http://localhost:3000/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout API failed:", error);
        }

        dispatch(logout());
        if (onLogout) onLogout();
        navigate("/");
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
                            <strong>{internships.length}</strong>
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
                                AI-powered matches based on your profile and preferences.
                            </p>
                        </div>
                    </div>

                    {/* RECOMMENDATION LIST */}
                    <div className="recommendation-list">
                        {internships.map((internship) => {
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

                                        <small>{internship.reason}</small>
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
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
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