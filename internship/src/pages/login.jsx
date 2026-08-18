import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ExternalLink
} from "lucide-react";
import "./login.css";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
        // API route to be integrated
        console.log("Login submitted:", { ...data, rememberMe });
        // Simulate brief network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
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

                        {/* Remember Me Checkbox */}
                        <div className="form-options-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="checkbox-input"
                                />
                                <span className="checkbox-text">
                                    Keep me logged in for 30 days
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                        >
                            <span>{isSubmitting ? "Authenticating..." : "Sign In"}</span>
                            <ArrowRight className="submit-btn-icon" />
                        </button>
                    </form>

                    {/* Sign Up Redirect */}
                    <p className="signup-prompt">
                        Don't have an account?{" "}
                        <button type="button" className="signup-link-btn">
                            Register
                        </button>
                    </p>
                </div>
            </div>

            {/* ----------------- RIGHT SIDE: HERO & SCHEME HIGHLIGHTS ----------------- */}
            <div className="login-right-section">
                {/* Background Ambient Glow Elements */}
                <div className="bg-ambient-orb-top" />
                <div className="bg-ambient-orb-bottom" />
                <div className="bg-grid-pattern" />

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