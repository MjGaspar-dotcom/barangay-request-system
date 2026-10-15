import { useState } from "react";
import { TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FieldValidationError from "../../components/forms/FieldValidationError";
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

function StaffLogin() {
    // Get the shared login function from AuthContext.
    // This sends the username and password to the Laravel API.
    const { login } = useAuth();

    // Used to redirect the Staff after successful login.
    const navigate = useNavigate();

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

    // Handles submission of the Staff login form.
    const submitLogin = async (values) => {
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
        <AuthPage>
            <AuthCard>
                <AuthHeader>
                    <AuthLogo>B</AuthLogo>

                    <AuthLabel>STAFF PORTAL</AuthLabel>

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
    );
}

export default StaffLogin;
