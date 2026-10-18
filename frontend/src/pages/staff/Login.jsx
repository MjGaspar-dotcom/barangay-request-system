import { useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FieldValidationError from "../../components/forms/FieldValidationError";
=======
=======
>>>>>>> Stashed changes
import BrandMark from "../../components/ui/BrandMark";
import { Link, useNavigate } from "react-router-dom";
>>>>>>> Stashed changes
import { useAuth } from "../../hooks/useAuth";
import {
    AuthCard,
    AuthDescription,
    AuthFooter,
    AuthFooterLink,
    AuthForm,
    AuthFormField,
    AuthHeader,
    AuthLabel,
    AuthLogo,
    AuthPage,
    AuthSubmitButton,
    AuthTitle,
} from "../../styles/auth.styles";

import { validateForm } from "../../utils/validateForm";
function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

    // Used to redirect the Staff after successful login.
    const navigate = useNavigate();

<<<<<<< Updated upstream
=======
    // Store the values entered into the login form.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

>>>>>>> Stashed changes
    // Stores an error message when login fails.
    const [loginError, setLoginError] = useState("");

    // Prevents multiple submissions while login is processing.
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            username: "",
            password: "",
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Handles submission of the Staff login form.
    const submitLogin = async (values) => {
=======
        if (!validateForm(event.currentTarget)) return;

>>>>>>> Stashed changes
=======
        if (!validateForm(event.currentTarget)) return;

>>>>>>> Stashed changes
        // Remove any previous error before attempting login.
        setLoginError("");

        // Disable the login button while the request is processing.
        setLoading(true);

        try {
            // Send the credentials to the shared authentication function.
            await login(values.username, values.password);

            // Login succeeded, so redirect the Staff to their dashboard.
            navigate("/staff/dashboard");
        } catch (error) {
            // HTTP 401 means the username or password is incorrect.
            if (error.response?.status === 401) {
                setLoginError("Invalid username or password.");
            } else {
                // Handles other problems such as server or network errors.
                setLoginError("Login failed. Please try again.");
            }
        } finally {
            // Always stop the loading state after the request finishes.
            setLoading(false);
        }
    };

    const usernameField = register("username", {
        required: "Username is required.",
    });

    const passwordField = register("password", {
        required: "Password is required.",
    });

    return (
<<<<<<< Updated upstream
        <AuthPage>
            <AuthCard>
                <AuthHeader>
                    <AuthLogo>B</AuthLogo>

                    <AuthLabel>STAFF PORTAL</AuthLabel>
=======
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                    <AuthTitle>Staff Login</AuthTitle>

                    <AuthDescription>
                        Sign in to manage and process barangay document
                        requests.
                    </AuthDescription>
                </AuthHeader>

                <AuthForm onSubmit={handleSubmit(submitLogin)} noValidate>
                    <AuthFormField>
                        <TextField
                            id="staff-username"
                            name={usernameField.name}
                            type="text"
                            fullWidth
                            required
                            label="Username"
                            autoComplete="username"
                            onChange={usernameField.onChange}
                            onBlur={usernameField.onBlur}
                            inputRef={usernameField.ref}
                            error={Boolean(errors.username)}
                            placeholder="Enter your username"
                            slotProps={{
                                htmlInput: {
                                    "aria-invalid": Boolean(errors.username),
                                    "aria-describedby": errors.username
                                        ? "staff-username-error"
                                        : undefined,
                                },
                            }}
                        />

                        <FieldValidationError
                            id="staff-username-error"
                            error={errors.username}
                        />
                    </AuthFormField>

<<<<<<< Updated upstream
                    <AuthFormField>
                        <TextField
                            id="staff-password"
                            name={passwordField.name}
                            type="password"
                            fullWidth
                            required
                            label="Password"
                            autoComplete="current-password"
                            onChange={passwordField.onChange}
                            onBlur={passwordField.onBlur}
                            inputRef={passwordField.ref}
                            error={Boolean(errors.password)}
                            placeholder="Enter your password"
                            slotProps={{
                                htmlInput: {
                                    "aria-invalid": Boolean(errors.password),
                                    "aria-describedby": errors.password
                                        ? "staff-password-error"
                                        : undefined,
                                },
                            }}
                        />

                        <FieldValidationError
                            id="staff-password-error"
                            error={errors.password}
                        />
                    </AuthFormField>

                    {loginError && (
                        <FieldValidationError
                            id="staff-login-error"
                            error={loginError}
                        />
                    )}

                    <AuthSubmitButton
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </AuthSubmitButton>
                </AuthForm>

                <AuthFooter>
                    <AuthFooterLink to="/">
                        ← Back to Home
                    </AuthFooterLink>
                </AuthFooter>
            </AuthCard>
        </AuthPage>
=======
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
>>>>>>> Stashed changes
    );
}

export default StaffLogin;
