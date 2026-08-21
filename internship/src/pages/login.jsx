import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ExternalLink,
    Info,
    AlertCircle
} from "lucide-react";
import "./login.css";
import { Link, useNavigate, useLocation } from "react-router";
import { authenticateAndLogin } from "../features/useLoggedInSlice";

export default function Login() {
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState("");
    const [infoNotification, setInfoNotification] = useState(location.state?.notification || location.state?.message || "");
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
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        setApiError("");
        setInfoNotification("");
        const resultAction = await dispatch(authenticateAndLogin(data));

        if (authenticateAndLogin.fulfilled.match(resultAction)) {
            navigate("/dashboard");
        } else {
            console.error("Login API Error:", resultAction.payload);
            setApiError(resultAction.payload || "Invalid email or password");
        }
    };

    return (
        <div className="login-page-container">
            {/* ----------------- LEFT SIDE: LOGIN FORM ----------------- */}
            <div className="login-left-section">
                {/* Top Branding / Logo */}
                <div className="login-header">
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
                            Sign In to Your Account
                        </h1>
                    </div>

                    {/* Notification & Error Alerts */}
                    {infoNotification && (
                        <div style={{ color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "10px", fontWeight: "500" }}>
                            <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span>{infoNotification}</span>
                        </div>
                    )}
                    {apiError && (
                        <div style={{ color: "#ef4444", backgroundColor: "#fef2f2", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "10px" }}>
                            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                            <span>{apiError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="login-form">




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
                            <div className="form-label-row">
                                <label className="form-label">
                                    Password
                                </label>
                                <button type="button" className="forgot-password-link">
                                    Forgot password?
                                </button>
                            </div>

                            <div className="input-icon-wrapper">
                                <div className="input-icon-prefix">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
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
                            <span>Sign In</span>
                            <ArrowRight className="submit-btn-icon" />
                        </button>
                    </form>

                    {/* Sign Up Redirect */}
                    <p className="signup-prompt">
                        Don't have an account?{" "}
                        <Link to="/signup">
                            <button type="button" className="signup-link-btn">
                                Register
                            </button>
                        </Link>
                    </p>
                </div>
            </div>

            {/* ----------------- RIGHT SIDE: HERO & SCHEME HIGHLIGHTS ----------------- */}
            <div className="login-right-section">

                {/* Middle Welcome & Core Content */}
                <div className="hero-content">
                    <h2 className="hero-title">
                        Empowering India's Youth with Industry Excellence.
                    </h2>

                    <p className="hero-description">
                        Welcome back to the Prime Minister’s Internship Scheme. Connect with India's top 500
                        enterprises for hands-on internships.
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