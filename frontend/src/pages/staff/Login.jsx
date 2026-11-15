import Icon from "../../components/ui/Icon.jsx";
import { useState } from "react";
import BrandMark from "../../components/ui/BrandMark";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import { validateForm } from "../../utils/validateForm";
function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login, logout } = useAuth();

    // Used to redirect the authenticated account to its role-specific dashboard.
    const navigate = useNavigate();

    // Store the values entered into the login form.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Stores an error message when login fails.
    const [error, setError] = useState("");

    // Prevents multiple submissions while login is processing.
    const [loading, setLoading] = useState(false);

    // Handles submission of the shared staff and administrator login form.
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
            const user = await login(username, password);

            if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else if (user.role === "staff") {
                navigate("/staff/dashboard");
            } else {
                await logout();
                setError("This account does not have staff or administrator access.");
            }
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
        <div className="portal-auth-page portal-auth-split">
            <div className="portal-auth-card portal-auth-split-card">
                <aside className="portal-auth-brand">
                    <div className="portal-auth-brand-lockup">
                        <BrandMark className="portal-auth-brand-logo" />
                        <div>
                            <strong>BarangayEase</strong>
                            <span>Barangay Aurora</span>
                        </div>
                    </div>

                    <div className="portal-auth-brand-seal">
                        <BrandMark className="portal-auth-seal" />
                    </div>

                    <div className="portal-auth-brand-description">
                        <span>BARANGAY AURORA</span>
                        <p>
                            Barangay document requests and processing in one
                            system.
                        </p>
                    </div>
                </aside>

                <section
                    className="portal-auth-content"
                    aria-labelledby="staff-login-title"
                >
                    <div className="portal-auth-form">
                        <div className="portal-auth-welcome">
                            <span className="portal-auth-label">
                                STAFF LOGIN
                            </span>
                            <h1 id="staff-login-title">Sign In</h1>
                            <p>Sign in to continue to BarangayEase</p>
                        </div>

                        {error && (
                            <div className="portal-auth-error" role="alert">
                                <Icon name="exclamation-circle-fill" />
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
                                    placeholder="Enter your username"
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
                                        <Icon
                                            name={showPassword ? "eye-slash" : "eye"}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="portal-login-button"
                                disabled={loading}
                                aria-busy={loading || undefined}
                                aria-label={loading ? "Signing in" : undefined}
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>
                    </div>
                    <p className="portal-auth-note">
                        Barangay Aurora · Alicia, Isabela
                    </p>
                </section>
            </div>
        </div>
    );
}

export default StaffLogin;
