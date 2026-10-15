import { useState } from "react";
import { Checkbox, MenuItem, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import EmailOtpVerification from "../../components/forms/EmailOtpVerification";
import FieldValidationError from "../../components/forms/FieldValidationError";
import api from "../../services/api";
import {
    AuthCardWide,
    AuthDescription,
    AuthFooter,
    AuthFooterLink,
    AuthForm,
    AuthFormField,
    AuthHeader,
    AuthLabel,
    AuthMessage,
    AuthMiddleNameOption,
    AuthPage,
    AuthSubmitButton,
    AuthTitle,
    FormSection,
    FormSectionTitle,
    FullWidthField,
    ThreeColumnFormGrid,
    TwoColumnFormGrid,
} from "../../styles/auth.styles";

const DEFAULT_FORM_VALUES = {
    username: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    middle_name: "",
    no_middle_name: false,
    last_name: "",
    birth_date: "",
    gender: "",
    civil_status: "",
    address: "",
    contact_number: "",
    email: "",
};

function Register() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [success, setSuccess] = useState("");
    const [emailVerification, setEmailVerification] = useState({
        email: "",
        token: "",
    });

    const {
        control,
        handleSubmit,
        setError,
        setValue,
        clearErrors,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const password = watch("password");
    const email = watch("email");
    const noMiddleName = watch("no_middle_name");

    const applyServerValidationErrors = (validationErrors) => {
        let hasMappedError = false;

        Object.entries(validationErrors).forEach(([fieldName, messages]) => {
            if (
                !Object.prototype.hasOwnProperty.call(
                    DEFAULT_FORM_VALUES,
                    fieldName,
                )
            ) {
                return;
            }

            const message = Array.isArray(messages) ? messages[0] : messages;

            setError(fieldName, {
                type: "server",
                message,
            });

            hasMappedError = true;
        });

        return hasMappedError;
    };

    const submitRegistration = async (values) => {
        const normalizedEmail = values.email.trim().toLowerCase();
        const {
            no_middle_name,
            ...registrationValues
        } = values;

        setRequestError("");
        setSuccess("");

        if (
            !emailVerification.token ||
            emailVerification.email !== normalizedEmail
        ) {
            setRequestError(
                "Verify your email address with the OTP code before creating your account.",
            );
            return;
        }

        setLoading(true);

        try {
            await api.post("/register", {
                ...registrationValues,
                email: normalizedEmail,
                email_verification_token: emailVerification.token,
            });

            setSuccess(
                "Registration successful. You can now log in to your account.",
            );

            window.setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration failed:", error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data?.errors;

                if (validationErrors) {
                    const hasMappedError =
                        applyServerValidationErrors(validationErrors);

                    if (!hasMappedError) {
                        setRequestError(
                            error.response.data?.message ||
                                "Please review your information and try again.",
                        );
                    }
                } else {
                    setRequestError(
                        error.response.data?.message ||
                            "Please review your information and try again.",
                    );
                }
            } else {
                setRequestError(
                    error.response?.data?.message ||
                        "Registration failed. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthPage>
            <AuthCardWide>
                <AuthHeader>
                    <AuthLabel>CREATE ACCOUNT</AuthLabel>

                    <AuthTitle>Resident Registration</AuthTitle>

                    <AuthDescription>
                        Create an account to request and track barangay
                        documents online.
                    </AuthDescription>
                </AuthHeader>

                {success && (
                    <AuthMessage severity="success">{success}</AuthMessage>
                )}

                <AuthForm
                    onSubmit={handleSubmit(submitRegistration)}
                    noValidate
                >
                    <FormSection>
                        <FormSectionTitle>Account Information</FormSectionTitle>

                        <TwoColumnFormGrid>
                            <AuthFormField>
                                <Controller
                                    name="username"
                                    control={control}
                                    rules={{
                                        required: "Username is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="username"
                                            name={field.name}
                                            type="text"
                                            fullWidth
                                            required
                                            label="Username"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.username)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.username,
                                                    ),
                                                    "aria-describedby":
                                                        errors.username
                                                            ? "register-username-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-username-error"
                                    error={errors.username}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: "Email is required.",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message:
                                                "Enter a valid email address.",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="email"
                                            name={field.name}
                                            type="email"
                                            fullWidth
                                            required
                                            label="Email"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.email)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.email,
                                                    ),
                                                    "aria-describedby":
                                                        errors.email
                                                            ? "register-email-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-email-error"
                                    error={errors.email}
                                />

                                <EmailOtpVerification
                                    email={email}
                                    purpose="registration"
                                    idPrefix="register-email"
                                    onVerificationChange={
                                        setEmailVerification
                                    }
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{
                                        required: "Password is required.",
                                        minLength: {
                                            value: 8,
                                            message:
                                                "Password must be at least 8 characters.",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="password"
                                            name={field.name}
                                            type="password"
                                            fullWidth
                                            required
                                            label="Password"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.password)}
                                            slotProps={{
                                                htmlInput: {
                                                    minLength: 8,
                                                    "aria-invalid": Boolean(
                                                        errors.password,
                                                    ),
                                                    "aria-describedby":
                                                        errors.password
                                                            ? "register-password-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-password-error"
                                    error={errors.password}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="password_confirmation"
                                    control={control}
                                    rules={{
                                        required: "Confirm your password.",
                                        validate: (value) =>
                                            value === password ||
                                            "Passwords do not match.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="password_confirmation"
                                            name={field.name}
                                            type="password"
                                            fullWidth
                                            required
                                            label="Confirm Password"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(
                                                errors.password_confirmation,
                                            )}
                                            slotProps={{
                                                htmlInput: {
                                                    minLength: 8,
                                                    "aria-invalid": Boolean(
                                                        errors.password_confirmation,
                                                    ),
                                                    "aria-describedby":
                                                        errors.password_confirmation
                                                            ? "register-password-confirmation-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-password-confirmation-error"
                                    error={errors.password_confirmation}
                                />
                            </AuthFormField>
                        </TwoColumnFormGrid>
                    </FormSection>

                    <FormSection>
                        <FormSectionTitle>
                            Personal Information
                        </FormSectionTitle>

                        <ThreeColumnFormGrid>
                            <AuthFormField>
                                <Controller
                                    name="first_name"
                                    control={control}
                                    rules={{
                                        required: "First name is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="first_name"
                                            name={field.name}
                                            type="text"
                                            fullWidth
                                            required
                                            label="First Name"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.first_name)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.first_name,
                                                    ),
                                                    "aria-describedby":
                                                        errors.first_name
                                                            ? "register-first-name-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-first-name-error"
                                    error={errors.first_name}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="middle_name"
                                    control={control}
                                    rules={{
                                        validate: (value) =>
                                            noMiddleName ||
                                            value.trim() !== "" ||
                                            "Middle name is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="middle_name"
                                            name={field.name}
                                            type="text"
                                            fullWidth
                                            required={!noMiddleName}
                                            disabled={noMiddleName}
                                            label="Middle Name"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(
                                                errors.middle_name,
                                            )}
                                            placeholder={
                                                noMiddleName
                                                    ? "No middle name"
                                                    : "Enter middle name"
                                            }
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.middle_name,
                                                    ),
                                                    "aria-describedby":
                                                        errors.middle_name
                                                            ? "register-middle-name-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <Controller
                                    name="no_middle_name"
                                    control={control}
                                    render={({ field }) => (
                                        <AuthMiddleNameOption
                                            control={
                                                <Checkbox
                                                    name={field.name}
                                                    checked={field.value}
                                                    onChange={(event) => {
                                                        const checked =
                                                            event.target
                                                                .checked;

                                                        field.onChange(
                                                            checked,
                                                        );

                                                        if (checked) {
                                                            setValue(
                                                                "middle_name",
                                                                "",
                                                            );

                                                            clearErrors(
                                                                "middle_name",
                                                            );
                                                        }
                                                    }}
                                                    onBlur={field.onBlur}
                                                    inputRef={field.ref}
                                                />
                                            }
                                            label="I have no middle name"
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-middle-name-error"
                                    error={errors.middle_name}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="last_name"
                                    control={control}
                                    rules={{
                                        required: "Last name is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="last_name"
                                            name={field.name}
                                            type="text"
                                            fullWidth
                                            required
                                            label="Last Name"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.last_name)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.last_name,
                                                    ),
                                                    "aria-describedby":
                                                        errors.last_name
                                                            ? "register-last-name-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-last-name-error"
                                    error={errors.last_name}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="birth_date"
                                    control={control}
                                    rules={{
                                        required: "Birth date is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="birth_date"
                                            name={field.name}
                                            type="date"
                                            fullWidth
                                            required
                                            label="Birth Date"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.birth_date)}
                                            slotProps={{
                                                inputLabel: {
                                                    shrink: true,
                                                },
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.birth_date,
                                                    ),
                                                    "aria-describedby":
                                                        errors.birth_date
                                                            ? "register-birth-date-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-birth-date-error"
                                    error={errors.birth_date}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="gender"
                                    control={control}
                                    rules={{
                                        required: "Select your gender.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="gender"
                                            name={field.name}
                                            select
                                            fullWidth
                                            required
                                            label="Gender"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.gender)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.gender,
                                                    ),
                                                    "aria-describedby":
                                                        errors.gender
                                                            ? "register-gender-error"
                                                            : undefined,
                                                },
                                            }}
                                        >
                                            <MenuItem value="">
                                                Select gender
                                            </MenuItem>

                                            <MenuItem value="Male">
                                                Male
                                            </MenuItem>

                                            <MenuItem value="Female">
                                                Female
                                            </MenuItem>
                                        </TextField>
                                    )}
                                />

                                <FieldValidationError
                                    id="register-gender-error"
                                    error={errors.gender}
                                />
                            </AuthFormField>

                            <AuthFormField>
                                <Controller
                                    name="civil_status"
                                    control={control}
                                    rules={{
                                        required: "Select your civil status.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="civil_status"
                                            name={field.name}
                                            select
                                            fullWidth
                                            required
                                            label="Civil Status"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.civil_status)}
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.civil_status,
                                                    ),
                                                    "aria-describedby":
                                                        errors.civil_status
                                                            ? "register-civil-status-error"
                                                            : undefined,
                                                },
                                            }}
                                        >
                                            <MenuItem value="">
                                                Select civil status
                                            </MenuItem>

                                            <MenuItem value="Single">
                                                Single
                                            </MenuItem>

                                            <MenuItem value="Married">
                                                Married
                                            </MenuItem>

                                            <MenuItem value="Widowed">
                                                Widowed
                                            </MenuItem>

                                            <MenuItem value="Separated">
                                                Separated
                                            </MenuItem>
                                        </TextField>
                                    )}
                                />

                                <FieldValidationError
                                    id="register-civil-status-error"
                                    error={errors.civil_status}
                                />
                            </AuthFormField>

                            <FullWidthField>
                                <Controller
                                    name="address"
                                    control={control}
                                    rules={{
                                        required: "Purok is required.",
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="purok"
                                            name={field.name}
                                            fullWidth
                                            required
                                            label="Purok"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(errors.address)}
                                            placeholder="e.g., Purok 3"
                                            slotProps={{
                                                htmlInput: {
                                                    "aria-invalid": Boolean(
                                                        errors.address,
                                                    ),
                                                    "aria-describedby":
                                                        errors.address
                                                            ? "register-address-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-address-error"
                                    error={errors.address}
                                />
                            </FullWidthField>

                            <AuthFormField>
                                <Controller
                                    name="contact_number"
                                    control={control}
                                    rules={{
                                        required: "Contact number is required.",
                                        pattern: {
                                            value: /^09\d{9}$/,
                                            message:
                                                "Enter a valid 11-digit mobile number.",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            id="contact_number"
                                            name={field.name}
                                            type="tel"
                                            fullWidth
                                            required
                                            label="Contact Number"
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            inputRef={field.ref}
                                            error={Boolean(
                                                errors.contact_number,
                                            )}
                                            helperText="Used for contact only. OTP verification is sent to your email."
                                            slotProps={{
                                                htmlInput: {
                                                    inputMode: "numeric",
                                                    maxLength: 11,
                                                    "aria-invalid": Boolean(
                                                        errors.contact_number,
                                                    ),
                                                    "aria-describedby":
                                                        errors.contact_number
                                                            ? "register-contact-number-error"
                                                            : undefined,
                                                },
                                            }}
                                        />
                                    )}
                                />

                                <FieldValidationError
                                    id="register-contact-number-error"
                                    error={errors.contact_number}
                                />
                            </AuthFormField>
                        </ThreeColumnFormGrid>
                    </FormSection>

                    {requestError && (
                        <FieldValidationError
                            id="register-form-error"
                            error={requestError}
                        />
                    )}

                    <AuthSubmitButton
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </AuthSubmitButton>
                </AuthForm>

                <AuthFooter>
                    <p>
                        <span>Already have an account?</span>{" "}
                        <AuthFooterLink to="/login">Login</AuthFooterLink>
                    </p>

                    <AuthFooterLink to="/">
                        ← Back to Home
                    </AuthFooterLink>
                </AuthFooter>
            </AuthCardWide>
        </AuthPage>
    );
}

export default Register;
