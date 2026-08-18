import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

    // Used to redirect the Staff after successful login.
    const navigate = useNavigate();

    // Store the values entered in the login form.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Store and display login errors.
    const [error, setError] = useState("");

    // Used to disable the button while login is processing.
    const [loading, setLoading] = useState(false);

    // Handle Staff login form submission.
    const handleSubmit = async (event) => {
        // Prevent the browser from refreshing the page.
        event.preventDefault();

        // Clear any previous error message.
        setError("");

        // Start loading state.
        setLoading(true);

        try {
            // Send credentials to the Laravel login API.
            await login(username, password);

            // Login successful:
            // Redirect the Staff to the Staff Dashboard.
            navigate("/staff/dashboard");
        } catch (error) {
            // Laravel returns 401 when username/password is invalid.
            if (error.response?.status === 401) {
                setError("Invalid username or password.");
            } else {
                // Handles other errors such as server/API problems.
                setError("Login failed. Please try again.");
            }
        } finally {
            // Stop loading whether login succeeds or fails.
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Staff login page title */}
            <h1>Staff Login</h1>

            {/* Staff login form */}
            <form onSubmit={handleSubmit}>

                {/* Username */}
                <div>
                    <label htmlFor="staff-username">
                        Username
                    </label>

                    <input
                        id="staff-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="staff-password">
                        Password
                    </label>

                    <input
                        id="staff-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                    />
                </div>

                {/* Display login error if one exists */}
                {error && <p>{error}</p>}

                {/* Submit button */}
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>
        </div>
    );
}

export default StaffLogin;