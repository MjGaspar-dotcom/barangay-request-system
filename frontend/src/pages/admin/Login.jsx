import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Login() {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const { login } = useAuth();
    const navigate = useNavigate();

    // Form values
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // UI states
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // HANDLE LOGIN
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

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
                    ←
                </Link>

                {/* =================================================
                GREEN HEADER
                ================================================= */}
                <div className="portal-auth-header">
                    {/* Temporary logo */}
                    <div className="auth-logo">B</div>

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
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* =================================================
                    LOGIN FORM
                    ================================================= */}
                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className="portal-form-group">
                            <label htmlFor="admin-username">Username</label>

                            <input
                                id="admin-username"
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder="Enter administrator username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="portal-form-group">
                            <label htmlFor="admin-password">Password</label>

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
                                "SIGN IN TO ADMIN PORTAL"
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
