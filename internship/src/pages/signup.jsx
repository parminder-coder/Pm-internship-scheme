import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ExternalLink
} from "lucide-react";
import "./signup.css";
import { Link } from "react-router"

export default function Signup({ onNavigateToLogin }) {
    const [showPassword, setShowPassword] = useState(false);

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
        // API route to be integrated
        console.log("Signup submitted:", data);
        // Simulate brief network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
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
