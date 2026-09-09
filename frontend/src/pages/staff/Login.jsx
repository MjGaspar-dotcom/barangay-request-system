import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

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
            await login(username, password);

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
        <div className="auth-page">
            <div className="auth-card">

                {/* Login page header and Staff portal identification */}
                <div className="auth-header">
                    <div className="auth-logo">B</div>

                    <span className="section-label">
                        STAFF PORTAL
                    </span>

                    <h1>Staff Login</h1>

                    <p>
                        Sign in to manage and process barangay
                        document requests.
                    </p>
                </div>

                {/* Display an error message when authentication fails */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Staff authentication form */}
                <form onSubmit={handleSubmit}>
                    {/* Username field */}
                    <div className="mb-3">
                        <label
                            htmlFor="staff-username"
                            className="form-label"
                        >
                            Username
                        </label>

                        <input
                            id="staff-username"
                            name="username"
                            type="text"
                            className="form-control"
                            autoComplete="username"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    {/* Password field */}
                    <div className="mb-4">
                        <label
                            htmlFor="staff-password"
                            className="form-label"
                        >
                            Password
                        </label>

                        <input
                            id="staff-password"
                            name="password"
                            type="password"
                            className="form-control"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/* Return to the public landing page */}
                <div className="auth-footer">
                    <Link to="/">
                        ← Back to Barangay Document System
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default StaffLogin;