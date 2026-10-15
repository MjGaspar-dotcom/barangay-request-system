import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login, logout } = useAuth();

    // Used to redirect the Staff after successful login.
    const navigate = useNavigate();

    // Store the values entered into the login form.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Stores an error message when login fails.
    const [error, setError] = useState("");

    // Prevents multiple submissions while login is processing.
    const [loading, setLoading] = useState(false);

    // Handles submission of the Staff login form.
    const handleSubmit = async (event) => {
        // Prevent the browser from refreshing the page.
        event.preventDefault();

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
                    ←
                </Link>

                <div className="portal-auth-header">
                    <div className="auth-logo">B</div>

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
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="portal-form-group">
                            <label htmlFor="staff-username">Username</label>
                            <input
                                id="staff-username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder="Enter staff username"
                                required
                            />
                        </div>

                        <div className="portal-form-group">
                            <label htmlFor="staff-password">Password</label>
                            <input
                                id="staff-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="portal-login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "SIGN IN TO STAFF PORTAL"}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default StaffLogin;