import { useEffect, useState } from "react";
import { Button, CircularProgress, MenuItem, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import api from "../../services/api";
import FieldValidationError from "./FieldValidationError";
import {
    FormField,
    RequestFormLoading,
    RequestFormRoot,
    RequestSuccessMessage,
} from "./RequestForm.styles";

const DEFAULT_FORM_VALUES = {
    document_type_id: "",
    purpose: "",
};

export default function UserRequestForm() {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
    const [documentTypesError, setDocumentTypesError] = useState("");
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [success, setSuccess] = useState("");

    const {
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                const response = await api.get("/document-types");

                setDocumentTypes(response.data.data);
            } catch (error) {
                console.error(error);
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

    const submitRequest = async (values) => {
        setRequestError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await api.post("/barangay-requests", values);

            setSuccess(
                `Request submitted successfully. Tracking number: ${response.data.data.tracking_number}`,
            );

            reset(DEFAULT_FORM_VALUES);
        } catch (error) {
            console.error(error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data?.errors;

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
                setRequestError("Unable to submit request. Please try again.");
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
                                    "aria-describedby": errors.document_type_id
                                        ? "user-document-type-error"
                                        : undefined,
                                },
                            }}
                        >
                            <MenuItem value="">Select a document</MenuItem>

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
                    id="user-document-type-error"
                    error={errors.document_type_id}
                />
            </FormField>

            {documentTypesError && (
                <FieldValidationError
                    id="user-document-types-load-error"
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
                            slotProps={{
                                htmlInput: {
                                    "aria-invalid": Boolean(errors.purpose),
                                    "aria-describedby": errors.purpose
                                        ? "user-purpose-error"
                                        : undefined,
                                },
                            }}
                        />
                    )}
                />

                <FieldValidationError
                    id="user-purpose-error"
                    error={errors.purpose}
                />
            </FormField>

            {requestError && (
                <FieldValidationError
                    id="user-request-form-error"
                    error={requestError}
                />
            )}

            {success && (
                <RequestSuccessMessage
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {success}
                </RequestSuccessMessage>
            )}

            <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
            </Button>
        </RequestFormRoot>
    );
}
