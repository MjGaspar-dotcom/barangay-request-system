import { useState } from "react";
import BrandMark from "../../components/ui/BrandMark";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import { validateForm } from "../../utils/validateForm";
function Login() {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const { login } = useAuth();
    const navigate = useNavigate();

    // Form values
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // UI states
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // HANDLE LOGIN
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm(event.currentTarget)) return;

        setError("");
        setLoading(true);

        try {
            // Use the existing authentication function.
            const response = await login(username, password);

            // Only administrators should enter the admin dashboard.
            if (response.role === "admin") {
                navigate("/admin/dashboard");
                return;
            }

            // If another type of account tries to use
            // the administrator login page, deny access.
            setError("This account does not have administrator access.");
        } catch (error) {
            // Laravel returned an authentication error.
            if (error.response?.status === 401) {
                setError("Invalid username or password.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // PAGE UI
    // =====================================================

    return (
        <div className="portal-auth-page">
            <div className="portal-auth-card">
                <Link
                    to="/"
                    className="auth-back-arrow"
                    aria-label="Back to Barangay Document System"
                    title="Back to Barangay Document System"
                >
<<<<<<< HEAD
                    ←
=======
                    <i className="bi bi-arrow-left" aria-hidden="true" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                </Link>

                {/* =================================================
                GREEN HEADER
                ================================================= */}
                <div className="portal-auth-header">
                    {/* Temporary logo */}
<<<<<<< HEAD
                    <div className="auth-logo">B</div>
=======
                    <BrandMark className="auth-logo" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

                    <span className="portal-auth-label">
                        ADMINISTRATOR PORTAL
                    </span>

                    <h1>Barangay Document System</h1>

                    <p>
                        Integrated Document Request, Processing, and Analytics
                        System
                    </p>
                </div>

                {/* =================================================
                LOGIN CONTENT
                ================================================= */}
                <div className="portal-auth-body">
                    {/* Welcome message */}
                    <div className="portal-auth-welcome">
                        <h2>Welcome Back!</h2>

                        <p>Please login to continue</p>
                    </div>

                    {/* =================================================
                    ERROR MESSAGE
                    ================================================= */}
                    {error && (
<<<<<<< HEAD
                        <div className="alert alert-danger" role="alert">
                            {error}
=======
                        <div className="portal-auth-error" role="alert">
                            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                            <span>{error}</span>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        </div>
                    )}

                    {/* =================================================
                    LOGIN FORM
                    ================================================= */}
<<<<<<< HEAD
                    <form onSubmit={handleSubmit}>
=======
                    <form noValidate onSubmit={handleSubmit}>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        {/* Username */}
                        <div className="portal-form-group">
                            <label htmlFor="admin-username">Username</label>

                            <input
                                id="admin-username"
<<<<<<< HEAD
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
=======
                                name="username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setError("");
                                }}
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                placeholder="Enter administrator username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="portal-form-group">
                            <label htmlFor="admin-password">Password</label>

<<<<<<< HEAD
                            <input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
=======
                            <div className="portal-form-password">
                                <input
                                    id="admin-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword((visible) => !visible)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                >
                                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                                </button>
                            </div>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            className="portal-login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Signing in...
                                </>
                            ) : (
<<<<<<< HEAD
                                "SIGN IN TO ADMIN PORTAL"
=======
                                "Sign in to admin portal"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            )}
                        </button>
                    </form>

                    {/* =================================================
                    FOOTER LINK
                    ================================================= */}
                </div>
            </div>
        </div>
    );
}

export default Login;
