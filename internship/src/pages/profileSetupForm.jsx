/**
 * ProfileSetupForm.jsx
 * -----------------------------------------------------------------------
 * Applicant profile setup form for the PM Internship Scheme Smart
 * Allocation Engine. Built with react-hook-form (+ useFieldArray for the
 * dynamic skills list). Captures education, skills, location/sector
 * preferences, and resume upload.
 * -----------------------------------------------------------------------
 */

import React, { useState, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
    User,
    Mail,
    Calendar,
    GraduationCap,
    Sparkles,
    Plus,
    Trash2,
    CheckCircle2,
    ArrowRight,
    Info,
    Award,
    Building2,
    UploadCloud,
    FileText,
    FileCheck,
    Link2
} from "lucide-react";
import "./profileSetupForm.css";

const SECTORS = [
    "Information Technology & Software",
    "Manufacturing & Automotive",
    "Banking & Financial Services",
    "Healthcare & Pharmaceuticals",
    "Agriculture & Allied Sectors",
    "Infrastructure & Construction",
    "Retail & E-commerce",
    "Energy, Oil & Renewables",
    "Media, Telecom & Design",
    "Tourism & Hospitality",
    "Electronics & Semiconductors",
    "Logistics & Supply Chain"
];

const QUALIFICATIONS = [
    "Class 12 / Diploma",
    "Undergraduate (Pursuing)",
    "Undergraduate (Completed)",
    "Postgraduate (Pursuing)",
    "Postgraduate (Completed)",
    "ITI / Vocational Certification"
];

const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Delhi NCR",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu & Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
];

const POPULAR_SKILLS = [
    "Python",
    "Data Analytics",
    "AutoCAD",
    "Financial Modeling",
    "React.js",
    "Digital Marketing",
    "Tally Prime",
    "Java",
    "Project Management",
    "SQL",
    "Machine Learning",
    "Graphic Design"
];

const emptySkill = { name: "", proficiency: "Beginner" };

export default function ProfileSetupForm({ onSubmit, defaultValues }) {
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeError, setResumeError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            dob: "",
            gender: "",
            qualification: "",
            fieldOfStudy: "",
            institution: "",
            yearOfPassing: "",
            cgpaOrPercentage: "",
            skills: [emptySkill],
            preferredStates: [],
            willingToRelocate: false,
            sectorInterests: [],
            portfolioUrl: "",
            ...defaultValues,
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "skills" });
    const skillsWatched = watch("skills");

    const addSuggestedSkill = (skillName) => {
        const exists = skillsWatched?.some(
            (s) => s.name?.toLowerCase().trim() === skillName.toLowerCase().trim()
        );
        if (!exists) {
            if (fields.length === 1 && !skillsWatched?.[0]?.name) {
                setValue("skills.0.name", skillName);
            } else {
                append({ name: skillName, proficiency: "Intermediate" });
            }
        }
    };

    const handleFileValidation = (file) => {
        setResumeError("");
        if (!file) return;

        const allowedExtensions = [".pdf", ".doc", ".docx"];
        const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

        if (!allowedExtensions.includes(fileExtension)) {
            setResumeError("Please upload a valid document format (.pdf, .doc, .docx)");
            return;
        }

        if (file.size > maxSizeInBytes) {
            setResumeError("File size exceeds 5MB limit. Please upload a smaller file.");
            return;
        }

        setResumeFile({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            rawFile: file,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        handleFileValidation(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileValidation(file);
    };

    const removeResume = () => {
        setResumeFile(null);
        setResumeError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const submitHandler = async (data) => {
        try {
            const payload = {
                ...data,
                resume: resumeFile ? { name: resumeFile.name, size: resumeFile.size } : null,
            };

            if (onSubmit) {
                await onSubmit(payload);
            } else {
                console.log("Applicant profile submitted:", payload);
            }
            setSaveSuccess(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error("Submission failed:", err);
        }
    };

    return (
        <div className="pis-page-wrapper">
            {/* ----------------- TOP NAVBAR ----------------- */}
            <nav className="pis-navbar">
                <div className="pis-navbar-inner">
                    <div className="pis-brand">
                        <div className="pis-brand-badge">PM</div>
                        <div className="pis-brand-text">
                            <span className="pis-brand-title">PM Internship Scheme</span>
                            <span className="pis-brand-sub">Government of India Initiative</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ----------------- MAIN FORM CONTAINER ----------------- */}
            <div className="pis-container">
                {/* Hero Header Banner */}
                <header className="pis-hero-banner">
                    <h1 className="pis-hero-title">Applicant Profile Setup</h1>
                    <p className="pis-hero-desc">
                        Provide your comprehensive background, verified skills, and deployment preferences.
                    </p>
                </header>

                {/* Info Notice Alert */}
                <div className="pis-notice-box">
                    <Info size={20} className="pis-notice-icon" />
                    <p className="pis-notice-text">
                        <strong>Allocation Guideline:</strong> Please ensure your qualification, category, and district
                        details match your Aadhaar & academic transcripts.
                    </p>
                </div>

                {saveSuccess && (
                    <div className="pis-success-toast">
                        <CheckCircle2 size={20} />
                        <span>Your applicant profile has been saved successfully and submitted to the AI Matching Engine!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(submitHandler)} noValidate>
                    {/* ==========================================================================
             SECTION 1: PERSONAL DETAILS
             ========================================================================== */}
                    <section className="pis-form-section">
                        <div className="pis-section-header">
                            <div className="pis-step-badge">1</div>
                            <div className="pis-section-titles">
                                <h2 className="pis-section-title">Personal Details</h2>
                                <span className="pis-section-subtitle">
                                    Identity and contact information
                                </span>
                            </div>
                        </div>

                        <div className="pis-grid-2">
                            {/* Full Name */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Full Name (as per Aadhaar/ID)<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <User size={17} className="pis-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Rahul Sharma"
                                        {...register("fullName", {
                                            required: "Full name is required",
                                            minLength: { value: 2, message: "Name must be at least 2 characters" }
                                        })}
                                        className={`pis-input ${errors.fullName ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.fullName && (
                                    <span className="pis-err-msg">• {errors.fullName.message}</span>
                                )}
                            </div>

                            {/* Email Address */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Email Address<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <Mail size={17} className="pis-input-icon" />
                                    <input
                                        type="email"
                                        placeholder="student@example.com"
                                        {...register("email", {
                                            required: "Email address is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Enter a valid email address"
                                            }
                                        })}
                                        className={`pis-input ${errors.email ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="pis-err-msg">• {errors.email.message}</span>
                                )}
                            </div>

                            {/* Mobile Phone Number */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Mobile Phone Number<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <span className="pis-phone-prefix">🇮🇳 +91</span>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        {...register("phone", {
                                            required: "10-digit mobile number is required",
                                            pattern: {
                                                value: /^[6-9]\d{9}$/,
                                                message: "Enter a valid 10-digit Indian mobile number"
                                            }
                                        })}
                                        className={`pis-input pis-input-phone ${errors.phone ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.phone && (
                                    <span className="pis-err-msg">• {errors.phone.message}</span>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Date of Birth<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <Calendar size={17} className="pis-input-icon" />
                                    <input
                                        type="date"
                                        {...register("dob", { required: "Date of birth is required" })}
                                        className={`pis-input ${errors.dob ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.dob && (
                                    <span className="pis-err-msg">• {errors.dob.message}</span>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="pis-field-group pis-span-full">
                                <label className="pis-field-label">
                                    <span>Gender<span className="pis-req-star">*</span></span>
                                </label>
                                <select
                                    {...register("gender", { required: "Please select your gender" })}
                                    defaultValue=""
                                    className={`pis-input pis-input-no-icon pis-select ${errors.gender ? "pis-input-error" : ""}`}
                                >
                                    <option value="" disabled>Select Gender</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="transgender">Transgender</option>
                                    <option value="prefer_not_to_say">Prefer not to disclose</option>
                                </select>
                                {errors.gender && (
                                    <span className="pis-err-msg">• {errors.gender.message}</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================================
             SECTION 2: ACADEMIC QUALIFICATIONS
             ========================================================================== */}
                    <section className="pis-form-section">
                        <div className="pis-section-header">
                            <div className="pis-step-badge">2</div>
                            <div className="pis-section-titles">
                                <h2 className="pis-section-title">Academic Qualifications</h2>
                                <span className="pis-section-subtitle">
                                    Highest education qualification, academic institution, and performance
                                </span>
                            </div>
                        </div>

                        <div className="pis-grid-2">
                            {/* Highest Qualification */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Highest Qualification<span className="pis-req-star">*</span></span>
                                </label>
                                <select
                                    {...register("qualification", { required: "Please select highest qualification" })}
                                    defaultValue=""
                                    className={`pis-input pis-input-no-icon pis-select ${errors.qualification ? "pis-input-error" : ""}`}
                                >
                                    <option value="" disabled>Select Qualification Level</option>
                                    {QUALIFICATIONS.map((q) => (
                                        <option key={q} value={q}>{q}</option>
                                    ))}
                                </select>
                                {errors.qualification && (
                                    <span className="pis-err-msg">• {errors.qualification.message}</span>
                                )}
                            </div>

                            {/* Field of Study */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Field of Study / Discipline<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <GraduationCap size={17} className="pis-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Computer Science, Mechanical, Commerce"
                                        {...register("fieldOfStudy", { required: "Field of study is required" })}
                                        className={`pis-input ${errors.fieldOfStudy ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.fieldOfStudy && (
                                    <span className="pis-err-msg">• {errors.fieldOfStudy.message}</span>
                                )}
                            </div>

                            {/* Institution Name */}
                            <div className="pis-field-group pis-span-full">
                                <label className="pis-field-label">
                                    <span>Institution / College / University Name<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <Building2 size={17} className="pis-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Delhi University / Government Polytechnic"
                                        {...register("institution", { required: "Institution name is required" })}
                                        className={`pis-input ${errors.institution ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.institution && (
                                    <span className="pis-err-msg">• {errors.institution.message}</span>
                                )}
                            </div>

                            {/* Year of Passing */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>Year of Passing / Expected<span className="pis-req-star">*</span></span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="2026"
                                    {...register("yearOfPassing", {
                                        required: "Year of passing is required",
                                        min: { value: 2018, message: "Enter a valid year (2018 onwards)" },
                                        max: { value: 2030, message: "Enter a valid year (up to 2030)" }
                                    })}
                                    className={`pis-input pis-input-no-icon ${errors.yearOfPassing ? "pis-input-error" : ""}`}
                                />
                                {errors.yearOfPassing && (
                                    <span className="pis-err-msg">• {errors.yearOfPassing.message}</span>
                                )}
                            </div>

                            {/* CGPA / Percentage */}
                            <div className="pis-field-group">
                                <label className="pis-field-label">
                                    <span>CGPA / Percentage Score<span className="pis-req-star">*</span></span>
                                </label>
                                <div className="pis-input-wrap">
                                    <Award size={17} className="pis-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. 8.4 CGPA or 79%"
                                        {...register("cgpaOrPercentage", { required: "CGPA or percentage is required" })}
                                        className={`pis-input ${errors.cgpaOrPercentage ? "pis-input-error" : ""}`}
                                    />
                                </div>
                                {errors.cgpaOrPercentage && (
                                    <span className="pis-err-msg">• {errors.cgpaOrPercentage.message}</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ==========================================================================
             SECTION 3: SKILLS & COMPETENCIES
             ========================================================================== */}
                    <section className="pis-form-section">
                        <div className="pis-section-header">
                            <div className="pis-step-badge">3</div>
                            <div className="pis-section-titles">
                                <h2 className="pis-section-title">Skills & Technical Competencies</h2>
                                <span className="pis-section-subtitle">
                                    List relevant functional and technical skills that drive your AI Match Score with corporate roles
                                </span>
                            </div>
                        </div>

                        {/* Quick-add suggestions */}
                        <div className="pis-skills-suggestion-row">
                            <span className="pis-suggestion-label">Quick Add:</span>
                            {POPULAR_SKILLS.map((skill) => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => addSuggestedSkill(skill)}
                                    className="pis-skill-chip-btn"
                                >
                                    + {skill}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Skill Rows */}
                        {fields.map((field, index) => (
                            <div key={field.id} className="pis-skill-row">
                                <div className="pis-field-group">
                                    <div className="pis-input-wrap">
                                        <Sparkles size={16} className="pis-input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Enter skill name (e.g. Python, SQL, AutoCAD)"
                                            {...register(`skills.${index}.name`, { required: "Skill name is required" })}
                                            className={`pis-input ${errors.skills?.[index]?.name ? "pis-input-error" : ""}`}
                                        />
                                    </div>
                                    {errors.skills?.[index]?.name && (
                                        <span className="pis-err-msg">• Skill name is required</span>
                                    )}
                                </div>                               

                                <button
                                    type="button"
                                    onClick={() => fields.length > 1 && remove(index)}
                                    disabled={fields.length === 1}
                                    className="pis-remove-skill-btn"
                                    title="Remove this skill"
                                >
                                    <Trash2 size={16} />
                                    <span>Remove</span>
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => append(emptySkill)}
                            className="pis-add-skill-btn"
                        >
                            <Plus size={16} />
                            <span>Add Another Skill</span>
                        </button>
                    </section>

                    {/* ==========================================================================
             SECTION 4: LOCATION & SECTOR PREFERENCES
             ========================================================================== */}
                    <section className="pis-form-section">
                        <div className="pis-section-header">
                            <div className="pis-step-badge">4</div>
                            <div className="pis-section-titles">
                                <h2 className="pis-section-title">Location & Sector Preferences</h2>
                                <span className="pis-section-subtitle">
                                    Designate your preferred geographical regions and target industrial domains
                                </span>
                            </div>
                        </div>

                        {/* Preferred States */}
                        <div className="pis-field-group" style={{ marginBottom: "1.75rem" }}>
                            <Controller
                                control={control}
                                name="preferredStates"
                                rules={{ validate: (v) => (v && v.length > 0) || "Select at least 1 preferred state" }}
                                render={({ field }) => (
                                    <>
                                        <div className="pis-field-label">
                                            <span>Preferred States for Internship (Select up to 3)<span className="pis-req-star">*</span></span>
                                            <span className="pis-selection-count-badge">
                                                Selected: {field.value?.length || 0} / 3
                                            </span>
                                        </div>

                                        <div className="pis-pill-grid">
                                            {INDIAN_STATES.map((s) => {
                                                const isSelected = field.value?.includes(s);
                                                const isMaxReached = (field.value?.length || 0) >= 3 && !isSelected;

                                                return (
                                                    <label
                                                        key={s}
                                                        className={`pis-pill-card ${isSelected ? "selected" : ""} ${isMaxReached ? "disabled" : ""}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={isMaxReached}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    if ((field.value?.length || 0) < 3) {
                                                                        field.onChange([...(field.value || []), s]);
                                                                    }
                                                                } else {
                                                                    field.onChange(field.value?.filter((v) => v !== s));
                                                                }
                                                            }}
                                                        />
                                                        <span>{s}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            />
                            {errors.preferredStates && (
                                <span className="pis-err-msg">• {errors.preferredStates.message}</span>
                            )}
                        </div>

                        {/* Willing to Relocate Card */}
                        <div style={{ marginBottom: "1.75rem" }}>
                            <label className="pis-affirmative-card">
                                <input
                                    type="checkbox"
                                    className="pis-checkbox-lg"
                                    {...register("willingToRelocate")}
                                />
                                <div className="pis-affirmative-text">
                                    <span className="pis-affirmative-title">
                                        I am willing to relocate outside my preferred states for high-match opportunities
                                    </span>
                                    <span className="pis-affirmative-sub">
                                        Enables the AI engine to recommend top corporate opportunities in other industrial hubs across India.
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Sector Interests */}
                        <div className="pis-field-group">
                            <Controller
                                control={control}
                                name="sectorInterests"
                                rules={{ validate: (v) => (v && v.length > 0) || "Select at least 1 industry sector" }}
                                render={({ field }) => (
                                    <>
                                        <div className="pis-field-label">
                                            <span>Target Industry Sectors<span className="pis-req-star">*</span></span>
                                            <span className="pis-selection-count-badge">
                                                Selected: {field.value?.length || 0}
                                            </span>
                                        </div>

                                        <div className="pis-pill-grid">
                                            {SECTORS.map((sector) => {
                                                const isSelected = field.value?.includes(sector);
                                                return (
                                                    <label
                                                        key={sector}
                                                        className={`pis-pill-card ${isSelected ? "selected" : ""}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                field.onChange(
                                                                    e.target.checked
                                                                        ? [...(field.value || []), sector]
                                                                        : field.value?.filter((v) => v !== sector)
                                                                );
                                                            }}
                                                        />
                                                        <span>{sector}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            />
                            {errors.sectorInterests && (
                                <span className="pis-err-msg">• {errors.sectorInterests.message}</span>
                            )}
                        </div>
                    </section>

                    {/* ==========================================================================
             SECTION 5: RESUME & DOCUMENTS
             ========================================================================== */}
                    <section className="pis-form-section">
                        <div className="pis-section-header">
                            <div className="pis-step-badge">5</div>
                            <div className="pis-section-titles">
                                <h2 className="pis-section-title">Resume / CV Upload</h2>
                                <span className="pis-section-subtitle">
                                    Upload your latest resume for corporate evaluation and automated skills verification
                                </span>
                            </div>
                        </div>

                        {/* Upload Dropzone */}
                        {!resumeFile ? (
                            <div
                                className={`pis-dropzone ${isDragging ? "dragging" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx"
                                    style={{ display: "none" }}
                                />
                                <div className="pis-dropzone-icon-badge">
                                    <UploadCloud size={28} />
                                </div>
                                <p className="pis-dropzone-title">
                                    <span>Click to browse</span> or drag and drop your resume here
                                </p>
                                <p className="pis-dropzone-sub">
                                    Supported file formats: PDF, DOC, DOCX
                                </p>
                                <span className="pis-dropzone-format-pill">
                                    <FileCheck size={14} />
                                    <span>Maximum file size: 5 MB</span>
                                </span>
                            </div>
                        ) : (
                            <div className="pis-file-preview-card">
                                <div className="pis-file-left">
                                    <div className="pis-file-icon-badge">
                                        <FileText size={22} />
                                    </div>
                                    <div className="pis-file-details">
                                        <span className="pis-file-name">{resumeFile.name}</span>
                                        <span className="pis-file-meta">
                                            <span>{resumeFile.size}</span>
                                            <span>•</span>
                                            <span>Ready for submission</span>
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={removeResume}
                                    className="pis-file-remove-btn"
                                    title="Remove uploaded resume"
                                >
                                    <Trash2 size={14} />
                                    <span>Remove</span>
                                </button>
                            </div>
                        )}

                        {resumeError && (
                            <span className="pis-err-msg" style={{ marginTop: "0.5rem" }}>
                                • {resumeError}
                            </span>
                        )}
                    </section>

                    {/* ==========================================================================
             ACTIONS BAR
             ========================================================================== */}

                    <div className="pis-actions-btn-group">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="pis-save-btn"
                        >
                            <span>{isSubmitting ? "Saving Profile..." : "Save & Continue"}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}