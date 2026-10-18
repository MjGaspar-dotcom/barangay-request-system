import { useState } from "react";
import { TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FieldValidationError from "../../components/forms/FieldValidationError";
import { useAuth } from "../../hooks/useAuth";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
import BrandMark from "../../components/ui/BrandMark";
>>>>>>> Stashed changes
=======
import BrandMark from "../../components/ui/BrandMark";
>>>>>>> Stashed changes

import { validateForm } from "../../utils/validateForm";
function Login() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

    // Used to redirect the user after successful authentication.
    const navigate = useNavigate();

    // Stores an authentication error returned by the API.
    const [loginError, setLoginError] = useState("");

    // Prevents the user from submitting the form multiple times.
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
    // Handles submission of the login form.
    const submitLogin = async (values) => {
=======
        if (!validateForm(event.currentTarget)) return;

>>>>>>> Stashed changes
=======
        if (!validateForm(event.currentTarget)) return;

>>>>>>> Stashed changes
        // Clear any previous login error.
        setLoginError("");

        // Disable the button while authentication is processing.
        setLoading(true);

        try {
            // Send the username and password to AuthContext.
            // The returned user contains the user's role.
            const user = await login(values.username, values.password);

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
                setLoginError("Invalid username or password.");
            } else {
                // Handles server, network, or other API errors.
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
        <AuthPage>
            <AuthCard>
                <AuthHeader>
                    <AuthLogo>B</AuthLogo>

<<<<<<< Updated upstream
                    <AuthLabel>BARANGAY DOCUMENT SYSTEM</AuthLabel>
=======
                {/* Authentication page header */}
                <div className="auth-header">
                    {/* Barangay system logo */}
                    <BrandMark className="auth-logo" />
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                    <AuthTitle>Welcome Back</AuthTitle>

                    <AuthDescription>
                        Sign in to request and track your barangay documents
                        online.
                    </AuthDescription>
                </AuthHeader>

<<<<<<< Updated upstream
                <AuthForm onSubmit={handleSubmit(submitLogin)} noValidate>
                    <AuthFormField>
                        <TextField
=======
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
                <form noValidate onSubmit={handleSubmit}>
                    {/* Username field */}
                    <div className="mb-3">
                        <label
                            htmlFor="username"
                            className="form-label"
                        >
                            Username
                        </label>

                        <input
>>>>>>> Stashed changes
                            id="username"
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
                                        ? "username-error"
                                        : undefined,
                                },
                            }}
                        />

                        <FieldValidationError
                            id="username-error"
                            error={errors.username}
                        />
                    </AuthFormField>

                    <AuthFormField>
                        <TextField
                            id="password"
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
                                        ? "password-error"
                                        : undefined,
                                },
                            }}
                        />

                        <FieldValidationError
                            id="password-error"
                            error={errors.password}
                        />
                    </AuthFormField>

                    {loginError && (
                        <FieldValidationError
                            id="login-error"
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
                    <p>
                        Don&apos;t have an account?{" "}
                        <AuthFooterLink to="/register">
                            Create an account
                        </AuthFooterLink>
                    </p>

                    <AuthFooterLink to="/">
                        ← Back to Home
                    </AuthFooterLink>
                </AuthFooter>
            </AuthCard>
        </AuthPage>
    );
}

export default Login;
