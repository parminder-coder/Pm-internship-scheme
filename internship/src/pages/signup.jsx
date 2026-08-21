import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ExternalLink,
    Info,
    AlertCircle
} from "lucide-react";
import "./signup.css";
import { Link, useNavigate } from "react-router";
import { registerUser } from "../api/auth";
import { setSession } from "../features/useLoggedInSlice";

export default function Signup({ onNavigateToLogin }) {
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState("");
    const [notification, setNotification] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        setApiError("");
        setNotification("");
        try {
            const result = await registerUser(data);
            dispatch(setSession({ user: result.user }));
            navigate("/profileSetupForm");
        } catch (err) {
            console.error("Signup API Error:", err);
            if (err.message && err.message.toLowerCase().includes("already exists")) {
                const msg = "An account with this email already exists! Transferring to Sign In...";
                setNotification(msg);
                setTimeout(() => {
                    navigate("/", { state: { notification: "An account with this email already exists. Please sign in with your password." } });
                }, 1000);
            } else {
                setApiError(err.message || "Registration failed. Please try again.");
            }
        }
    };

    return (
        <div className="signup-page-container">
            {/* ----------------- LEFT SIDE: SIGNUP FORM ----------------- */}
            <div className="signup-left-section">
                {/* Top Branding / Logo */}
                <div className="signup-header">
                    <div className="brand-wrapper">
                        <div className="brand-logo-badge">
                            PM
                        </div>
                        <div className="brand-title-group">
                            <span className="brand-title">PM Internship</span>
                            <span className="brand-subtitle">Govt. of India Initiative</span>
                        </div>
                    </div>

                    <a href="#help" className="help-link">
                        Help & Guidelines
                        <ExternalLink size={12} />
                    </a>
                </div>

                {/* Form Container */}
                <div className="form-content-wrapper">
                    {/* Header Title */}
                    <div className="form-header">
                        <h1 className="form-title">
                            Create Your Account
                        </h1>
                    </div>

                    {/* Notification & Error Alerts */}
                    {notification && (
                        <div style={{ color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "10px", fontWeight: "500" }}>
                            <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span>{notification}</span>
                        </div>
                    )}
                    {apiError && (
                        <div style={{ color: "#ef4444", backgroundColor: "#fef2f2", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "10px" }}>
                            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                            <span>{apiError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="signup-form">



                        {/* Name Input */}
                        <div className="form-group">
                            <label className="form-label">
                                Full Name
                            </label>
                            <div className="input-icon-wrapper">
                                <div className="input-icon-prefix">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    {...register("name", {
                                        required: "Full name is required",
                                        minLength: {
                                            value: 2,
                                            message: "Name must be at least 2 characters",
                                        },
                                    })}
                                    className={`form-input ${errors.name ? "input-error" : ""}`}
                                />
                            </div>
                            {errors.name && (
                                <p className="field-error-text">
                                    <span>•</span> {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div className="form-group">
                            <label className="form-label">
                                Email
                            </label>
                            <div className="input-icon-wrapper">
                                <div className="input-icon-prefix">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="student@example.com"
                                    {...register("email", {
                                        required: "Email address is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Please enter a valid email address",
                                        },
                                    })}
                                    className={`form-input ${errors.email ? "input-error" : ""}`}
                                />
                            </div>
                            {errors.email && (
                                <p className="field-error-text">
                                    <span>•</span> {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="form-group">
                            <label className="form-label">
                                Password
                            </label>

                            <div className="input-icon-wrapper">
                                <div className="input-icon-prefix">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 8,
                                            message: "Password must be at least 8 characters",
                                        },
                                    })}
                                    className={`form-input password-input ${errors.password ? "input-error" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle-btn"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="field-error-text">
                                    <span>•</span> {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            <span>Sign Up</span>
                            <ArrowRight className="submit-btn-icon" />
                        </button>
                    </form>

                    {/* Sign In Redirect */}
                    <p className="signup-prompt">
                        Already have an account?{" "}
                        <Link to="/">
                            <button
                                type="button"
                                className="signup-link-btn"
                                onClick={onNavigateToLogin}
                            >
                                Sign In
                            </button>
                        </Link>
                    </p>
                </div>
            </div>

            {/* ----------------- RIGHT SIDE: HERO & SCHEME HIGHLIGHTS ----------------- */}
            <div className="signup-right-section">
                {/* Middle Welcome & Core Content */}
                <div className="hero-content">
                    <h2 className="hero-title">
                        Shape Your Future with India's Leading Enterprises.
                    </h2>

                    <p className="hero-description">
                        Join the Prime Minister’s Internship Scheme today.<br />  Gain real-world industry experience and professional mentorship.
                    </p>
                </div>

                {/* Right Footer */}
                <div className="hero-footer">
                    <div>
                        Ministry of Corporate Affairs • Government of India
                    </div>
                    <div className="footer-links">
                        <a href="#privacy">Privacy Policy</a>
                        <span>•</span>
                        <a href="#terms">Terms of Service</a>
                        <span>•</span>
                        <a href="#faq">FAQs</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
