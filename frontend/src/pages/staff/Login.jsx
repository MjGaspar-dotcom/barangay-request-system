import { useState } from "react";
import BrandMark from "../../components/ui/BrandMark";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import { validateForm } from "../../utils/validateForm";
function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login, logout } = useAuth();

    // Used to redirect the Staff after successful login.
    const navigate = useNavigate();

    // Store the values entered into the login form.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Stores an error message when login fails.
    const [error, setError] = useState("");

    // Prevents multiple submissions while login is processing.
    const [loading, setLoading] = useState(false);

    // Handles submission of the Staff login form.
    const handleSubmit = async (event) => {
        // Prevent the browser from refreshing the page.
        event.preventDefault();

        if (!validateForm(event.currentTarget)) return;

        // Remove any previous error before attempting login.
        setError("");

        // Disable the login button while the request is processing.
        setLoading(true);

        try {
            // Send the credentials to the shared authentication function.
            const response = await login(username, password);

            if (response.role !== "staff") {
                await logout();
                setError("This account does not have staff access.");
                return;
            }

            // Login succeeded, so redirect the Staff to their dashboard.
            navigate("/staff/dashboard");
        } catch (error) {
            // HTTP 401 means the username or password is incorrect.
            if (error.response?.status === 401) {
                setError("Invalid username or password.");
            } else {
                // Handles other problems such as server or network errors.
                setError("Login failed. Please try again.");
            }
        } finally {
            // Always stop the loading state after the request finishes.
            setLoading(false);
        }
    };

    return (
        <div className="portal-auth-page">
            <div className="portal-auth-card">
                <Link
                    to="/"
                    className="auth-back-arrow"
                    aria-label="Back to Barangay Document System"
                    title="Back to Barangay Document System"
                >
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                </Link>

                <div className="portal-auth-header">
                    <BrandMark className="auth-logo" />

                    <span className="portal-auth-label">
                        STAFF PORTAL
                    </span>

                    <h1>Barangay Document System</h1>

                    <p>
                        Integrated Document Request, Processing, and Analytics
                        System
                    </p>
                </div>

                <div className="portal-auth-body">
                    <div className="portal-auth-welcome">
                        <h2>Welcome Back!</h2>
                        <p>Please sign in to continue</p>
                    </div>

                    {error && (
                        <div className="portal-auth-error" role="alert">
                            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form noValidate onSubmit={handleSubmit}>
                        <div className="portal-form-group">
                            <label htmlFor="staff-username">Username</label>
                            <input
                                id="staff-username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setError("");
                                }}
                                placeholder="Enter staff username"
                                required
                            />
                        </div>

                        <div className="portal-form-group">
                            <label htmlFor="staff-password">Password</label>
                            <div className="portal-form-password">
                                <input
                                    id="staff-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter your password"
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
                        </div>

                        <button
                            type="submit"
                            className="portal-login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in to staff portal"}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default StaffLogin;