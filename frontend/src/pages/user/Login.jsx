import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

    // Used to redirect the user after successful authentication.
    const navigate = useNavigate();

    // Store the username entered in the login form.
    const [username, setUsername] = useState("");

    // Store the password entered in the login form.
    const [password, setPassword] = useState("");

    // Stores an error message when authentication fails.
    const [error, setError] = useState("");

    // Prevents the user from submitting the form multiple times.
    const [loading, setLoading] = useState(false);

    // Handles submission of the login form.
    const handleSubmit = async (event) => {
        // Prevent the browser from refreshing the page.
        event.preventDefault();

        // Clear any previous login error.
        setError("");

        // Disable the button while authentication is processing.
        setLoading(true);

        try {
            // Send the username and password to AuthContext.
            // The returned user contains the user's role.
            const user = await login(username, password);

            // Redirect the authenticated user based on their role.
            if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else if (user.role === "staff") {
                navigate("/staff/dashboard");
            } else {
                // Regular residents/users go to the user dashboard.
                navigate("/dashboard");
            }
        } catch (error) {
            // HTTP 401 means the username or password is incorrect.
            if (error.response?.status === 401) {
                setError("Invalid username or password.");
            } else {
                // Handles server, network, or other API errors.
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
                {/* Authentication page header */}
                <div className="auth-header">
                    {/* Barangay system logo */}
                    <div className="auth-logo">B</div>

                    <span className="section-label">
                        BARANGAY DOCUMENT SYSTEM
                    </span>

                    <h1>Welcome Back</h1>

                    <p>
                        Sign in to request and track your barangay
                        documents online.
                    </p>
                </div>

                {/* Display login error when authentication fails */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* User login form */}
                <form onSubmit={handleSubmit}>
                    {/* Username field */}
                    <div className="mb-3">
                        <label
                            htmlFor="username"
                            className="form-label"
                        >
                            Username
                        </label>

                        <input
                            id="username"
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
                            htmlFor="password"
                            className="form-label"
                        >
                            Password
                        </label>

                        <input
                            id="password"
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

                    {/* Submit login button */}
                    <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/* Registration and landing-page navigation */}
                <div className="auth-footer">
                    <p>
                        Don't have an account?{" "}
                        <Link to="/register">Create an account</Link>
                    </p>

                    <Link to="/">
                        ← Back to Barangay Document System
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;