import { useEffect, useState } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    MenuItem,
    TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import api from "../../services/api";
import EmailOtpVerification from "./EmailOtpVerification";
import FieldValidationError from "./FieldValidationError";
import {
    FormField,
    FormGrid,
    FormSection,
    FormSectionDescription,
    FormSectionHeader,
    FormSectionTitle,
    IdVerificationActions,
    IdVerificationFailureMessage,
    IdVerificationPendingMessage,
    IdVerificationSuccessMessage,
    IdCameraActions,
    MiddleNameOption,
    RequestFormLoading,
    RequestFormRoot,
    RequestSuccessMessage,
    TrackingMessage,
    TrackingNote,
    TrackingNumber,
    ValidIdPreview,
    ValidIdPreviewImage,
    ValidIdPreviewLabel,
} from "./RequestForm.styles";

const ID_VERIFY_ENDPOINT = "/id-verification";
const MAX_VALID_ID_IMAGE_SIZE = 5 * 1024 * 1024;
const VALID_ID_IMAGE_TYPES = ["image/jpeg", "image/png"];

const validateValidIdImage = (files) => {
    const file = files?.[0];

    if (!file) {
        return "Upload a clear photo of your valid ID.";
    }

    if (!VALID_ID_IMAGE_TYPES.includes(file.type)) {
        return "Upload a JPG or PNG image.";
    }

    if (file.size > MAX_VALID_ID_IMAGE_SIZE) {
        return "Valid ID image must not exceed 5 MB.";
    }

    return true;
};

const DEFAULT_FORM_VALUES = {
    document_type_id: "",
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
    valid_id_image: null,
    valid_id_type: "",
    purpose: "",
};

export default function GuestRequestForm({
    capturedIdResult,
    onOpenIdScanner,
}) {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
    const [documentTypesError, setDocumentTypesError] = useState("");

    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [success, setSuccess] = useState("");
    const [emailVerification, setEmailVerification] = useState({
        email: "",
        token: "",
    });
    const [trackingNumber, setTrackingNumber] = useState("");

    const [validIdPreview, setValidIdPreview] = useState("");
    const [verifyingId, setVerifyingId] = useState(false);
    const [idVerificationStatus, setIdVerificationStatus] = useState("");
    const [idVerificationMessage, setIdVerificationMessage] = useState("");

    const {
        control,
        register,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const noMiddleName = watch("no_middle_name");
    const email = watch("email");
    const selectedValidIdImage = watch("valid_id_image");

    const validIdImageField = register("valid_id_image", {
        validate: validateValidIdImage,
    });

    useEffect(() => {
        const file = capturedIdResult?.file;

        if (!file) {
            return;
        }

        const validationResult = validateValidIdImage([file]);

        if (validationResult !== true) {
            setError("valid_id_image", {
                type: "validate",
                message: validationResult,
            });
            return;
        }

        setValue("valid_id_image", [file], {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });

        clearErrors("valid_id_image");
        setIdVerificationStatus("");
        setIdVerificationMessage("");

        const reader = new FileReader();

        reader.onload = () => {
            setValidIdPreview(reader.result);
        };

        reader.onerror = () => {
            setValidIdPreview("");
            setError("valid_id_image", {
                type: "validate",
                message:
                    "Unable to preview the scanned ID. Please scan it again.",
            });
        };

        reader.readAsDataURL(file);
    }, [capturedIdResult, clearErrors, setError, setValue]);

    // Load document types from the API on mount.
    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                const response = await api.get("/document-types");

                setDocumentTypes(response.data.data);
            } catch (err) {
                console.error(err);
                setDocumentTypesError(
                    "Unable to load document types. Please try again.",
                );
            } finally {
                setLoadingDocumentTypes(false);
            }
        };

        fetchDocumentTypes();
    }, []);

    const applyServerValidationErrors = (validationErrors) => {
        let hasMappedError = false;

        Object.entries(validationErrors).forEach(([fieldName, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;

            if (
                Object.prototype.hasOwnProperty.call(
                    DEFAULT_FORM_VALUES,
                    fieldName,
                )
            ) {
                setError(fieldName, {
                    type: "server",
                    message,
                });

                hasMappedError = true;
            }
        });

        return hasMappedError;
    };

    const handleValidIdImageChange = (event) => {
        validIdImageField.onChange(event);
        setValidIdPreview("");
        setIdVerificationStatus("");
        setIdVerificationMessage("");

        const files = event.target.files;
        const validationResult = validateValidIdImage(files);

        if (validationResult !== true) {
            setError("valid_id_image", {
                type: "validate",
                message: validationResult,
            });

            return;
        }

        clearErrors("valid_id_image");

        const reader = new FileReader();

        reader.onload = () => {
            setValidIdPreview(reader.result);
        };

        reader.onerror = () => {
            setValidIdPreview("");
            setError("valid_id_image", {
                type: "validate",
                message:
                    "Unable to preview the selected image. Please choose another file.",
            });
        };

        reader.readAsDataURL(files[0]);
    };

    useEffect(() => {
        const file = selectedValidIdImage?.[0];

        if (!file) {
            setVerifyingId(false);
            setIdVerificationStatus("");
            setIdVerificationMessage("");
            setEmailVerification({
                email: "",
                token: "",
            });
            return;
        }

        const validationResult = validateValidIdImage([file]);

        if (validationResult !== true) {
            setVerifyingId(false);
            setIdVerificationStatus("");
            setIdVerificationMessage("");
            return;
        }

        const controller = new AbortController();

        const verifyIdInBackground = async () => {
            setVerifyingId(true);
            setIdVerificationStatus("");
            setIdVerificationMessage("");

            const data = new FormData();

            data.append("valid_id_image", file);

            try {
                const response = await api.post(ID_VERIFY_ENDPOINT, data, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    signal: controller.signal,
                });

                const result = response.data;

                if (result?.verified === true) {
                    setIdVerificationStatus("success");
                    setIdVerificationMessage(
                        result.message || "Your ID was successfully verified.",
                    );
                } else {
                    setIdVerificationStatus("failure");
                    setIdVerificationMessage(
                        result?.message ||
                            "Verification failed. Please scan or upload a clearer ID image.",
                    );
                }
            } catch (err) {
                if (
                    err?.code === "ERR_CANCELED" ||
                    err?.name === "CanceledError"
                ) {
                    return;
                }

                console.error(err);

                setIdVerificationStatus("failure");
                setIdVerificationMessage(
                    "Unable to verify your ID right now. Please scan or upload the ID again.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setVerifyingId(false);
                }
            }
        };

        verifyIdInBackground();

        return () => {
            controller.abort();
        };
    }, [selectedValidIdImage]);

    const submitRequest = async (values) => {
        const normalizedEmail = values.email.trim().toLowerCase();

        setRequestError("");
        setSuccess("");
        setTrackingNumber("");

        if (
            !emailVerification.token ||
            emailVerification.email !== normalizedEmail
        ) {
            setRequestError(
                "Verify your email address with the OTP code before submitting your request.",
            );
            return;
        }

        setLoading(true);

        try {
            const {
                no_middle_name,
                valid_id_image,
                ...requestValues
            } = values;

            const data = new FormData();

            for (const key in requestValues) {
                if (requestValues[key] !== null && requestValues[key] !== "") {
                    data.append(key, requestValues[key]);
                }
            }

            data.set("email", normalizedEmail);
            data.append(
                "email_verification_token",
                emailVerification.token,
            );

            if (valid_id_image?.[0]) {
                data.append("valid_id_image", valid_id_image[0]);
            }

            const response = await api.post("/guest-requests", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setTrackingNumber(response.data.data.tracking_number);

            setSuccess("Your request has been submitted successfully.");

            reset(DEFAULT_FORM_VALUES);
            setValidIdPreview("");
            setIdVerificationStatus("");
            setIdVerificationMessage("");
        } catch (err) {
            console.error(err);

            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors;

                if (validationErrors) {
                    const hasMappedError =
                        applyServerValidationErrors(validationErrors);

                    if (!hasMappedError) {
                        setRequestError(
                            "Please review the information you entered and try again.",
                        );
                    }
                } else {
                    setRequestError(
                        "Please review the information you entered and try again.",
                    );
                }
            } else {
                setRequestError(
                    "Unable to submit your request. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingDocumentTypes) {
        return (
            <RequestFormLoading>
                <CircularProgress color="success" size={24} />

                <span>Loading document types...</span>
            </RequestFormLoading>
        );
    }

    return (
        <RequestFormRoot onSubmit={handleSubmit(submitRequest)} noValidate>
            <FormSection>
                <FormSectionHeader>
                    <FormSectionTitle>1. Document Information</FormSectionTitle>

                    <FormSectionDescription>
                        Select the barangay document you need and tell us what
                        it will be used for.
                    </FormSectionDescription>
                </FormSectionHeader>

                <FormField>
                    <Controller
                        name="document_type_id"
                        control={control}
                        rules={{
                            required: "Select a document type.",
                        }}
                        render={({ field }) => (
                            <TextField
                                id="document_type_id"
                                select
                                fullWidth
                                required
                                disabled={documentTypes.length === 0}
                                label="Document Type"
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                inputRef={field.ref}
                                error={Boolean(errors.document_type_id)}
                                slotProps={{
                                    htmlInput: {
                                        "aria-invalid": Boolean(
                                            errors.document_type_id,
                                        ),
                                        "aria-describedby":
                                            errors.document_type_id
                                                ? "document_type_id-error"
                                                : undefined,
                                    },
                                }}
                            >
                                <MenuItem value="">Select document</MenuItem>

                                {documentTypes.map((documentType) => (
                                    <MenuItem
                                        key={documentType.document_type_id}
                                        value={documentType.document_type_id}
                                    >
                                        {documentType.document_name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    <FieldValidationError
                        id="document_type_id-error"
                        error={errors.document_type_id}
                    />
                </FormField>

                {documentTypesError && (
                    <FieldValidationError
                        id="document-types-load-error"
                        error={documentTypesError}
                    />
                )}

                <FormField>
                    <Controller
                        name="purpose"
                        control={control}
                        rules={{
                            required: "Enter the purpose of your request.",
                        }}
                        render={({ field }) => (
                            <TextField
                                id="purpose"
                                fullWidth
                                required
                                multiline
                                minRows={3}
                                label="Purpose"
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                inputRef={field.ref}
                                error={Boolean(errors.purpose)}
                                placeholder="Example: Employment requirement"
                                helperText="Briefly explain why you need this document."
                                slotProps={{
                                    htmlInput: {
                                        "aria-invalid": Boolean(errors.purpose),
                                        "aria-describedby": errors.purpose
                                            ? "purpose-error"
                                            : undefined,
                                    },
                                }}
                            />
                        )}
                    />

                    <FieldValidationError
                        id="purpose-error"
                        error={errors.purpose}
                    />
                </FormField>
            </FormSection>

            <FormSection>
                <FormSectionHeader>
                    <FormSectionTitle>2. Personal Information</FormSectionTitle>

                    <FormSectionDescription>
                        Enter your complete name and personal information
                        exactly as they appear on your valid ID.
                    </FormSectionDescription>
                </FormSectionHeader>

                <FormGrid>
                    <FormField>
                        <Controller
                            name="first_name"
                            control={control}
                            rules={{
                                required: "First name is required.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="first_name"
                                    type="text"
                                    fullWidth
                                    required
                                    label="First Name"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.first_name)}
                                    placeholder="Enter first name"
                                    slotProps={{
                                        htmlInput: {
                                            "aria-invalid": Boolean(
                                                errors.first_name,
                                            ),
                                            "aria-describedby":
                                                errors.first_name
                                                    ? "first_name-error"
                                                    : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="first_name-error"
                            error={errors.first_name}
                        />
                    </FormField>

                    <FormField>
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
                                    type="text"
                                    fullWidth
                                    required={!noMiddleName}
                                    disabled={noMiddleName}
                                    label="Middle Name"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.middle_name)}
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
                                                    ? "middle_name-error"
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
                                <MiddleNameOption
                                    control={
                                        <Checkbox
                                            name={field.name}
                                            checked={field.value}
                                            onChange={(e) => {
                                                const checked =
                                                    e.target.checked;

                                                field.onChange(checked);

                                                if (checked) {
                                                    setValue("middle_name", "");

                                                    clearErrors("middle_name");
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
                            id="middle_name-error"
                            error={errors.middle_name}
                        />
                    </FormField>

                    <FormField>
                        <Controller
                            name="last_name"
                            control={control}
                            rules={{
                                required: "Last name is required.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="last_name"
                                    type="text"
                                    fullWidth
                                    required
                                    label="Last Name"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.last_name)}
                                    placeholder="Enter last name"
                                    slotProps={{
                                        htmlInput: {
                                            "aria-invalid": Boolean(
                                                errors.last_name,
                                            ),
                                            "aria-describedby": errors.last_name
                                                ? "last_name-error"
                                                : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="last_name-error"
                            error={errors.last_name}
                        />
                    </FormField>

                    <FormField>
                        <Controller
                            name="birth_date"
                            control={control}
                            rules={{
                                required: "Birth date is required.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="birth_date"
                                    type="date"
                                    fullWidth
                                    required
                                    label="Birth Date"
                                    name={field.name}
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
                                                    ? "birth_date-error"
                                                    : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="birth_date-error"
                            error={errors.birth_date}
                        />
                    </FormField>

                    <FormField>
                        <Controller
                            name="gender"
                            control={control}
                            rules={{
                                required: "Select your gender.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="gender"
                                    select
                                    fullWidth
                                    required
                                    label="Gender"
                                    name={field.name}
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
                                            "aria-describedby": errors.gender
                                                ? "gender-error"
                                                : undefined,
                                        },
                                    }}
                                >
                                    <MenuItem value="">Select gender</MenuItem>

                                    <MenuItem value="Male">Male</MenuItem>

                                    <MenuItem value="Female">Female</MenuItem>

                                    <MenuItem value="Prefer not to say">
                                        Prefer not to say
                                    </MenuItem>
                                </TextField>
                            )}
                        />

                        <FieldValidationError
                            id="gender-error"
                            error={errors.gender}
                        />
                    </FormField>

                    <FormField>
                        <Controller
                            name="civil_status"
                            control={control}
                            rules={{
                                required: "Select your civil status.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="civil_status"
                                    select
                                    fullWidth
                                    required
                                    label="Civil Status"
                                    name={field.name}
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
                                                    ? "civil_status-error"
                                                    : undefined,
                                        },
                                    }}
                                >
                                    <MenuItem value="">
                                        Select civil status
                                    </MenuItem>

                                    <MenuItem value="Single">Single</MenuItem>

                                    <MenuItem value="Married">Married</MenuItem>

                                    <MenuItem value="Widowed">Widowed</MenuItem>

                                    <MenuItem value="Separated">
                                        Separated
                                    </MenuItem>
                                </TextField>
                            )}
                        />

                        <FieldValidationError
                            id="civil_status-error"
                            error={errors.civil_status}
                        />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection>
                <FormSectionHeader>
                    <FormSectionTitle>
                        3. Purok & Contact Information
                    </FormSectionTitle>

                    <FormSectionDescription>
                        Enter the purok where you currently reside within the
                        barangay, then provide your contact information.
                    </FormSectionDescription>
                </FormSectionHeader>

                <FormGrid>
                    <FormField>
                        <Controller
                            name="address"
                            control={control}
                            rules={{
                                required: "Purok is required.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="purok"
                                    type="text"
                                    fullWidth
                                    required
                                    label="Purok"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.address)}
                                    placeholder="e.g., Purok 3"
                                    helperText="Enter only your purok within the barangay."
                                    slotProps={{
                                        htmlInput: {
                                            "aria-invalid": Boolean(
                                                errors.address,
                                            ),
                                            "aria-describedby": errors.address
                                                ? "purok-error"
                                                : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="purok-error"
                            error={errors.address}
                        />
                    </FormField>

                    <FormField>
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
                                    type="text"
                                    fullWidth
                                    required
                                    label="Contact Number"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.contact_number)}
                                    placeholder="09XXXXXXXXX"
                                    helperText="Used for contact and request updates only. OTP verification is sent to your email."
                                    slotProps={{
                                        htmlInput: {
                                            inputMode: "numeric",
                                            maxLength: 11,
                                            "aria-invalid": Boolean(
                                                errors.contact_number,
                                            ),
                                            "aria-describedby":
                                                errors.contact_number
                                                    ? "contact_number-error"
                                                    : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="contact_number-error"
                            error={errors.contact_number}
                        />
                    </FormField>

                    <FormField>
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: "Email is required.",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Enter a valid email address.",
                                },
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="email"
                                    type="email"
                                    fullWidth
                                    required
                                    label="Email"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.email)}
                                    placeholder="example@email.com"
                                    helperText="Required. A verification code will be sent to this email."
                                    slotProps={{
                                        htmlInput: {
                                            "aria-invalid": Boolean(
                                                errors.email,
                                            ),
                                            "aria-describedby": errors.email
                                                ? "email-error"
                                                : undefined,
                                        },
                                    }}
                                />
                            )}
                        />

                        <FieldValidationError
                            id="email-error"
                            error={errors.email}
                        />

                        <EmailOtpVerification
                            email={email}
                            purpose="guest_request"
                            idPrefix="guest-request-email"
                            onVerificationChange={setEmailVerification}
                        />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection>
                <FormSectionHeader>
                    <FormSectionTitle>
                        4. Identity Verification
                    </FormSectionTitle>

                    <FormSectionDescription>
                        Provide a valid ID so barangay staff can verify the
                        identity of the requester.
                    </FormSectionDescription>
                </FormSectionHeader>

                <FormGrid>
                    <FormField>
                        <Controller
                            name="valid_id_type"
                            control={control}
                            rules={{
                                required: "Select your valid ID type.",
                            }}
                            render={({ field }) => (
                                <TextField
                                    id="valid_id_type"
                                    select
                                    fullWidth
                                    required
                                    label="Valid ID Type"
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    inputRef={field.ref}
                                    error={Boolean(errors.valid_id_type)}
                                    slotProps={{
                                        htmlInput: {
                                            "aria-invalid": Boolean(
                                                errors.valid_id_type,
                                            ),
                                            "aria-describedby":
                                                errors.valid_id_type
                                                    ? "valid_id_type-error"
                                                    : undefined,
                                        },
                                    }}
                                >
                                    <MenuItem value="">Select ID type</MenuItem>

                                    <MenuItem value="National ID">
                                        National ID
                                    </MenuItem>

                                    <MenuItem value="Driver's License">
                                        Driver&apos;s License
                                    </MenuItem>

                                    <MenuItem value="Passport">
                                        Passport
                                    </MenuItem>

                                    <MenuItem value="UMID">UMID</MenuItem>

                                    <MenuItem value="Other">Other</MenuItem>
                                </TextField>
                            )}
                        />

                        <FieldValidationError
                            id="valid_id_type-error"
                            error={errors.valid_id_type}
                        />
                    </FormField>

                    <FormField>
                        <TextField
                            id="valid_id_image"
                            type="file"
                            fullWidth
                            required
                            label="Upload Valid ID"
                            name={validIdImageField.name}
                            inputRef={validIdImageField.ref}
                            onChange={handleValidIdImageChange}
                            onBlur={validIdImageField.onBlur}
                            error={Boolean(errors.valid_id_image)}
                            helperText="Upload a JPG or PNG photo up to 5 MB, or scan your ID using the camera."
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                                htmlInput: {
                                    accept: "image/jpeg,image/png",
                                    "aria-invalid": Boolean(
                                        errors.valid_id_image,
                                    ),
                                    "aria-describedby": errors.valid_id_image
                                        ? "valid_id_image-error"
                                        : undefined,
                                },
                            }}
                        />

                        <IdCameraActions>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={onOpenIdScanner}
                                disabled={verifyingId}
                            >
                                Scan ID with Camera
                            </Button>
                        </IdCameraActions>

                        <FieldValidationError
                            id="valid_id_image-error"
                            error={errors.valid_id_image}
                        />

                        {validIdPreview && (
                            <ValidIdPreview>
                                <ValidIdPreviewLabel>
                                    Selected ID Preview
                                </ValidIdPreviewLabel>

                                <ValidIdPreviewImage
                                    src={validIdPreview}
                                    alt="Preview of selected valid ID"
                                />
                            </ValidIdPreview>
                        )}

                        {(verifyingId ||
                            idVerificationStatus === "success" ||
                            idVerificationStatus === "failure") && (
                            <IdVerificationActions>
                                {verifyingId && (
                                    <IdVerificationPendingMessage
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                    >
                                        <CircularProgress
                                            size={18}
                                            color="inherit"
                                        />
                                        <span>
                                            Verifying your ID automatically...
                                        </span>
                                    </IdVerificationPendingMessage>
                                )}

                                {idVerificationStatus === "success" && (
                                    <IdVerificationSuccessMessage
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                    >
                                        <strong>ID Verified</strong>
                                        <span>{idVerificationMessage}</span>
                                    </IdVerificationSuccessMessage>
                                )}

                                {idVerificationStatus === "failure" && (
                                    <IdVerificationFailureMessage
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                    >
                                        <strong>Verification Failed</strong>
                                        <span>{idVerificationMessage}</span>
                                    </IdVerificationFailureMessage>
                                )}
                            </IdVerificationActions>
                        )}
                    </FormField>
                </FormGrid>
            </FormSection>

            {requestError && (
                <FieldValidationError
                    id="request-form-error"
                    error={requestError}
                />
            )}

            {success && (
                <RequestSuccessMessage
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <TrackingMessage>{success}</TrackingMessage>

                    <TrackingMessage>
                        <strong>Tracking Number:</strong>{" "}
                        <TrackingNumber>{trackingNumber}</TrackingNumber>
                    </TrackingMessage>

                    <TrackingNote>
                        Save this tracking number to check your request status.
                    </TrackingNote>
                </RequestSuccessMessage>
            )}

            <Button
                type="submit"
                variant="contained"
                disabled={loading || verifyingId}
            >
                {loading ? "Submitting..." : "Submit Request"}
            </Button>
        </RequestFormRoot>
    );
}
