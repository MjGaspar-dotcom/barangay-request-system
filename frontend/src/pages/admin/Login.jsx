import { useState } from "react";
import { CircularProgress, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FieldValidationError from "../../components/forms/FieldValidationError";
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

function Login() {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const { login } = useAuth();
    const navigate = useNavigate();

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

    const submitLogin = async (values) => {
        setLoginError("");
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
        <AdminAuthPage>
            <AdminAuthCard>
                <AdminAuthHeader>
                    <AdminAuthLogo>B</AdminAuthLogo>

                    <AdminAuthLabel>ADMINISTRATOR PORTAL</AdminAuthLabel>

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
                                "SIGN IN TO ADMIN PORTAL"
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
