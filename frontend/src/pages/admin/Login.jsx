import { useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { CircularProgress, TextField } from "@mui/material";
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
    AdminAuthBody,
    AdminAuthCard,
    AdminAuthField,
    AdminAuthFooter,
    AdminAuthFooterLink,
    AdminAuthForm,
    AdminAuthHeader,
    AdminAuthLabel,
    AdminAuthLogo,
    AdminAuthPage,
    AdminAuthWelcome,
    AdminLoginButton,
} from "./Login.styles";

import { validateForm } from "../../utils/validateForm";
function Login() {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const { login } = useAuth();
    const navigate = useNavigate();

<<<<<<< Updated upstream
=======
    // Form values
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

>>>>>>> Stashed changes
    // UI states
    const [loginError, setLoginError] = useState("");
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

    // =====================================================
    // HANDLE LOGIN
    // =====================================================

<<<<<<< Updated upstream
    const submitLogin = async (values) => {
        setLoginError("");
=======
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm(event.currentTarget)) return;

        setError("");
>>>>>>> Stashed changes
        setLoading(true);

        try {
            // Use the existing authentication function.
            const response = await login(values.username, values.password);

            // Only administrators should enter the admin dashboard.
            if (response.role === "admin") {
                navigate("/admin/dashboard");
                return;
            }

            // If another type of account tries to use
            // the administrator login page, deny access.
            setLoginError("This account does not have administrator access.");
        } catch (error) {
            // Laravel returned an authentication error.
            if (error.response?.status === 401) {
                setLoginError("Invalid username or password.");
            } else {
                setLoginError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const usernameField = register("username", {
        required: "Username is required.",
    });

    const passwordField = register("password", {
        required: "Password is required.",
    });

    // =====================================================
    // PAGE UI
    // =====================================================

    return (
<<<<<<< Updated upstream
        <AdminAuthPage>
            <AdminAuthCard>
                <AdminAuthHeader>
                    <AdminAuthLogo>B</AdminAuthLogo>

                    <AdminAuthLabel>ADMINISTRATOR PORTAL</AdminAuthLabel>
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

                {/* =================================================
                GREEN HEADER
                ================================================= */}
                <div className="portal-auth-header">
                    {/* Temporary logo */}
                    <BrandMark className="auth-logo" />

                    <span className="portal-auth-label">
                        ADMINISTRATOR PORTAL
                    </span>
>>>>>>> Stashed changes

                    <h1>Barangay Document System</h1>

                    <p>
                        Integrated Document Request, Processing, and Analytics
                        System
                    </p>
                </AdminAuthHeader>

                <AdminAuthBody>
                    <AdminAuthWelcome>
                        <h2>Welcome Back!</h2>

                        <p>Please login to continue</p>
                    </AdminAuthWelcome>

<<<<<<< Updated upstream
                    <AdminAuthForm
                        onSubmit={handleSubmit(submitLogin)}
                        noValidate
                    >
                        <AdminAuthField>
                            <TextField
                                id="admin-username"
                                name={usernameField.name}
                                type="text"
                                fullWidth
                                required
                                label="Username"
                                onChange={usernameField.onChange}
                                onBlur={usernameField.onBlur}
                                inputRef={usernameField.ref}
                                error={Boolean(errors.username)}
=======
                    {/* =================================================
                    ERROR MESSAGE
                    ================================================= */}
                    {error && (
                        <div className="portal-auth-error" role="alert">
                            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* =================================================
                    LOGIN FORM
                    ================================================= */}
                    <form noValidate onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className="portal-form-group">
                            <label htmlFor="admin-username">Username</label>

                            <input
                                id="admin-username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setError("");
                                }}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                                placeholder="Enter administrator username"
                                autoComplete="username"
                                slotProps={{
                                    htmlInput: {
                                        "aria-invalid": Boolean(
                                            errors.username,
                                        ),
                                        "aria-describedby": errors.username
                                            ? "admin-username-error"
                                            : undefined,
                                    },
                                }}
                            />

                            <FieldValidationError
                                id="admin-username-error"
                                error={errors.username}
                            />
                        </AdminAuthField>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                        <AdminAuthField>
                            <TextField
                                id="admin-password"
                                name={passwordField.name}
                                type="password"
                                fullWidth
                                required
                                label="Password"
                                onChange={passwordField.onChange}
                                onBlur={passwordField.onBlur}
                                inputRef={passwordField.ref}
                                error={Boolean(errors.password)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                slotProps={{
                                    htmlInput: {
                                        "aria-invalid": Boolean(
                                            errors.password,
                                        ),
                                        "aria-describedby": errors.password
                                            ? "admin-password-error"
                                            : undefined,
                                    },
                                }}
                            />
=======
=======
>>>>>>> Stashed changes
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
                        </div>
>>>>>>> Stashed changes

                            <FieldValidationError
                                id="admin-password-error"
                                error={errors.password}
                            />
                        </AdminAuthField>

                        {loginError && (
                            <FieldValidationError
                                id="admin-login-error"
                                error={loginError}
                            />
                        )}

                        <AdminLoginButton type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in to admin portal"
                            )}
                        </AdminLoginButton>
                    </AdminAuthForm>

                    <AdminAuthFooter>
                        <AdminAuthFooterLink to="/">
                            ← Back to Home
                        </AdminAuthFooterLink>
                    </AdminAuthFooter>
                </AdminAuthBody>
            </AdminAuthCard>
        </AdminAuthPage>
    );
}

export default Login;
