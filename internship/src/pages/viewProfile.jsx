import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { performLogout } from "../features/useLoggedInSlice";
import { getStudentProfileApi } from "../api/auth";
import {
    UserRound,
    Mail,
    Phone,
    GraduationCap,
    MapPin,
    Briefcase,
    FileText,
    Edit3,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Sparkles,
    ShieldCheck,
    LogOut,
    Building2,
    Calendar,
    Award
} from "lucide-react";
import "./viewProfile.css";

export default function ViewProfile() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

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
        async function fetchProfile() {
            try {
                setLoading(true);
                const userStr = localStorage.getItem("user");
                const userObj = userStr ? JSON.parse(userStr) : null;
                const token = userObj?.token || "";

                const res = await getStudentProfileApi(token);
                if (res.success && res.profile) {
                    setProfile(res.profile);
                } else {
                    setErrorMsg("Profile details not found. Please complete your profile form.");
                }
            } catch (err) {
                console.error("Failed to load student profile:", err);
                setErrorMsg(err.message || "Failed to load profile details.");
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await dispatch(performLogout());
        navigate("/", { replace: true });
    };

    const personal = profile?.personalInfo || {};
    const edu = profile?.education || {};
    const loc = profile?.location || {};
    const pref = profile?.preferences || {};
    const parsedResume = profile?.resume?.parsed || {};
    const resumeUrl = profile?.resume?.fileUrl || "";

    const fullName = personal.name
        || (personal.firstName ? `${personal.firstName} ${personal.lastName || ""}`.trim() : userName);

    const formattedDOB = personal.DOB
        ? new Date(personal.DOB).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : null;

    const locationText = loc.preferredLocations && loc.preferredLocations.length > 0
        ? loc.preferredLocations.join(", ")
        : (personal.district ? `${personal.district}, ${personal.state}` : (personal.state || "N/A"));

    const collegeText = edu.institution || edu.college || "N/A";
    const passYearText = edu.GraduationYear || edu.passYear || "N/A";
    const cgpaText = edu.CGPA !== undefined ? `${edu.CGPA} CGPA` : (edu.cgpa !== undefined ? `${edu.cgpa} CGPA` : "N/A");

    const skillsList = parsedResume.skills && parsedResume.skills.length > 0
        ? parsedResume.skills
        : (pref.preferredRoles && pref.preferredRoles.length > 0 ? pref.preferredRoles : ["Web Development", "Python", "Problem Solving"]);

    const warnings = parsedResume.warnings || [];
    const bluffWords = parsedResume.bluffWords || [];

    return (
        <div className="view-profile-page">
            {/* TOP HEADER NAV */}
            <header className="vp-header">
                <div className="vp-header-brand">
                    <button className="vp-back-btn" onClick={() => navigate("/dashboard")} title="Back to Dashboard">
                        <ArrowLeft size={18} />
                        <span>Dashboard</span>
                    </button>

                    <div className="vp-brand-mark">
                        <div className="vp-logo-icon">PM</div>
                        <div>
                            <h2>PM Internship Scheme</h2>
                            <span>Student Profile Portal</span>
                        </div>
                    </div>
                </div>

                <div className="vp-header-actions">
                    <button className="vp-edit-btn" onClick={() => navigate("/profileSetupForm")}>
                        <Edit3 size={16} />
                        <span>Edit Profile</span>
                    </button>

                    <button className="vp-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="vp-container">
                {loading ? (
                    <div className="vp-loading-state">
                        <div className="vp-spinner"></div>
                        <p>Loading candidate profile details...</p>
                    </div>
                ) : errorMsg && !profile ? (
                    <div className="vp-error-card">
                        <AlertTriangle size={36} className="vp-error-icon" />
                        <h3>No Profile Saved Yet</h3>
                        <p>{errorMsg}</p>
                        <button className="vp-action-btn" onClick={() => navigate("/profileSetupForm")}>
                            Complete Profile Setup
                        </button>
                    </div>
                ) : (
                    <>
                        {/* HERO CARD */}
                        <div className="vp-hero-card">
                            <div className="vp-avatar-large">{userInitial}</div>

                            <div className="vp-hero-info">
                                <div className="vp-hero-title-row">
                                    <h1>{fullName}</h1>
                                    <span className="vp-badge-verified">
                                        <ShieldCheck size={14} /> Verified Candidate
                                    </span>
                                </div>

                                <p className="vp-hero-subtitle">
                                    {edu.degree || "Student"} {edu.field ? `in ${edu.field.toUpperCase()}` : ""} • {collegeText !== "N/A" ? collegeText.toUpperCase() : "PM Internship Applicant"}
                                </p>

                                <div className="vp-hero-contact-row">
                                    {personal.email || parsedResume.email ? (
                                        <span>
                                            <Mail size={14} /> {personal.email || parsedResume.email}
                                        </span>
                                    ) : null}

                                    {personal.phone || parsedResume.phone ? (
                                        <span>
                                            <Phone size={14} /> {personal.phone || parsedResume.phone}
                                        </span>
                                    ) : null}

                                    {locationText !== "N/A" ? (
                                        <span>
                                            <MapPin size={14} /> {locationText}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="vp-hero-actions">
                                <button className="vp-primary-action" onClick={() => navigate("/profileSetupForm")}>
                                    <Edit3 size={15} /> Update Form
                                </button>
                            </div>
                        </div>

                        {/* DISCREPANCY AUDIT BANNER IF ANY */}
                        {(warnings.length > 0 || bluffWords.length > 0) && (
                            <div className="vp-audit-banner">
                                <div className="vp-audit-header">
                                    <AlertTriangle size={18} className="vp-warn-icon" />
                                    <strong>Resume Verification Notice: {warnings.length + bluffWords.length} Item(s) Need Attention</strong>
                                </div>
                                <ul className="vp-audit-list">
                                    {bluffWords.map((word, i) => (
                                        <li key={`b-${i}`}>Unusual/Exaggerated keyword in resume: <strong>"{word}"</strong></li>
                                    ))}
                                    {warnings.map((warn, i) => (
                                        <li key={`w-${i}`}>{warn}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* PROFILE SECTIONS GRID */}
                        <div className="vp-grid">
                            {/* PERSONAL INFORMATION */}
                            <section className="vp-card">
                                <div className="vp-card-header">
                                    <UserRound size={18} className="vp-card-icon blue" />
                                    <h3>Personal Information</h3>
                                </div>

                                <div className="vp-details-list">
                                    <div className="vp-detail-item">
                                        <span className="vp-label">Full Name</span>
                                        <strong className="vp-value">{fullName}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Email Address</span>
                                        <strong className="vp-value">{personal.email || parsedResume.email || "N/A"}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Phone Number</span>
                                        <strong className="vp-value">{personal.phone || parsedResume.phone || "N/A"}</strong>
                                    </div>

                                    {formattedDOB && (
                                        <div className="vp-detail-item">
                                            <span className="vp-label">Date of Birth</span>
                                            <strong className="vp-value">{formattedDOB}</strong>
                                        </div>
                                    )}

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Gender</span>
                                        <strong className="vp-value">{personal.gender || "N/A"}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Category</span>
                                        <strong className="vp-value">{personal.category || "General"}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Location / States</span>
                                        <strong className="vp-value">{locationText}</strong>
                                    </div>
                                </div>
                            </section>

                            {/* ACADEMIC DETAILS */}
                            <section className="vp-card">
                                <div className="vp-card-header">
                                    <GraduationCap size={18} className="vp-card-icon purple" />
                                    <h3>Educational Qualification</h3>
                                </div>

                                <div className="vp-details-list">
                                    <div className="vp-detail-item">
                                        <span className="vp-label">Degree Qualification</span>
                                        <strong className="vp-value">{edu.degree || parsedResume.education || "N/A"}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Field of Study / Branch</span>
                                        <strong className="vp-value">{edu.field ? edu.field.toUpperCase() : (parsedResume.branch || "N/A")}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">College / Institute</span>
                                        <strong className="vp-value">{collegeText !== "N/A" ? collegeText.toUpperCase() : "N/A"}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">Passing Year</span>
                                        <strong className="vp-value">{passYearText}</strong>
                                    </div>

                                    <div className="vp-detail-item">
                                        <span className="vp-label">CGPA / Percentage</span>
                                        <strong className="vp-value">{cgpaText}</strong>
                                    </div>
                                </div>
                            </section>

                            {/* TECHNICAL SKILLS & RESUME PARSER */}
                            <section className="vp-card full-width">
                                <div className="vp-card-header">
                                    <Sparkles size={18} className="vp-card-icon emerald" />
                                    <h3>Parsed Technical Profile & Resume Analysis</h3>
                                </div>

                                <div className="vp-resume-block">
                                    <div className="vp-resume-status">
                                        <FileText size={20} className="vp-file-icon" />
                                        <div>
                                            <strong>{resumeUrl ? "Uploaded Resume File Verified" : "Resume Status"}</strong>
                                            <span>{resumeUrl ? "Parsed by AI ML Engine" : "No file attached"}</span>
                                        </div>
                                        {resumeUrl && (
                                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="vp-view-resume-link">
                                                View Resume PDF
                                            </a>
                                        )}
                                    </div>

                                    <div className="vp-skills-wrapper">
                                        <span className="vp-skills-label">Extracted Technical Skills:</span>
                                        <div className="vp-pills-row">
                                            {skillsList.map((skill, i) => (
                                                <span key={i} className="vp-skill-pill">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {parsedResume.matchExplanation && (
                                        <div className="vp-explanation-box">
                                            <strong>AI Candidate Profile Summary:</strong>
                                            <p>{parsedResume.matchExplanation}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* CAREER PREFERENCES */}
                            <section className="vp-card full-width">
                                <div className="vp-card-header">
                                    <Briefcase size={18} className="vp-card-icon amber" />
                                    <h3>Career & Internship Preferences</h3>
                                </div>

                                <div className="vp-preferences-grid">
                                    <div className="vp-pref-box">
                                        <span className="vp-label">Target Job Roles</span>
                                        <div className="vp-pills-row">
                                            {pref.preferredRoles && pref.preferredRoles.length > 0 ? (
                                                pref.preferredRoles.map((role, i) => (
                                                    <span key={i} className="vp-role-pill">{role}</span>
                                                ))
                                            ) : (
                                                <span className="vp-role-pill">Software Developer</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="vp-pref-box">
                                        <span className="vp-label">Preferred Sectors & Domains</span>
                                        <div className="vp-pills-row">
                                            {pref.sectors && pref.sectors.length > 0 ? (
                                                pref.sectors.map((sec, i) => (
                                                    <span key={i} className="vp-sector-pill">{sec}</span>
                                                ))
                                            ) : (
                                                <span className="vp-sector-pill">Information Technology</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="vp-pref-box">
                                        <span className="vp-label">Preferred Location</span>
                                        <strong className="vp-value">
                                            {loc.preferredDistrict ? `${loc.preferredDistrict}, ` : ""}{loc.preferredState || "All India"}
                                        </strong>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
