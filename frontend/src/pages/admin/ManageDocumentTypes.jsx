import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Alert,
    Button,
    CircularProgress,
    TableBody,
    TableHead,
    TextField,
} from "@mui/material";
import FieldValidationError from "../../components/forms/FieldValidationError";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import {
    AdminDataTable,
    AdminEmptyIcon,
    AdminEmptyState,
    AdminFilterBar,
    AdminMessages,
    AdminMutedText,
    AdminPage,
    AdminPageHeader,
    AdminPageLabel,
    AdminPageState,
    AdminResultsCount,
    AdminRowActions,
    AdminSearchField,
    AdminSection,
    AdminTableDataCell,
    AdminTableHeaderCell,
    AdminTablePrimaryText,
    AdminTableRow,
    AdminTableWrapper,
} from "../../components/admin/AdminCrud.styles";
import {
    DocumentActionsHeaderCell,
    DocumentDescriptionCell,
    DocumentFormActions,
    DocumentFormField,
    DocumentFormGrid,
    DocumentFormTitle,
    DocumentFullField,
    DocumentPageHeaderRow,
    DocumentStatusControl,
    DocumentStatusField,
    DocumentStatusSwitch,
} from "./ManageDocumentTypes.styles";

const EMPTY_FORM = {
    document_name: "",
    description: "",
    processing_days: 1,
    is_active: true,
};

export default function ManageDocumentTypes() {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setErrorMessage] = useState("");
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const {
        control,
        handleSubmit,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: EMPTY_FORM,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const fetchDocumentTypes = async () => {
        try {
            setLoading(true);

            const response = await api.get("/document-types");

            setDocumentTypes(response.data.data || []);
            setErrorMessage("");
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load document types.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    const flash = (message) => {
        setActionMessage(message);

        window.setTimeout(() => {
            setActionMessage("");
        }, 4000);
    };

    const handleEdit = (docType) => {
        reset({
            document_name: docType.document_name,
            description: docType.description || "",
            processing_days: docType.processing_days,
            is_active: Boolean(docType.is_active),
        });

        clearErrors();
        setEditingId(docType.document_type_id);
        setShowForm(true);
        setFormError("");
    };

    const handleCancel = () => {
        reset(EMPTY_FORM);
        clearErrors();
        setEditingId(null);
        setShowForm(false);
        setFormError("");
    };

    const applyServerValidationErrors = (validationErrors) => {
        let hasMappedError = false;

        Object.entries(validationErrors).forEach(([fieldName, messages]) => {
            if (!Object.prototype.hasOwnProperty.call(EMPTY_FORM, fieldName)) {
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

    const submitDocumentType = async (values) => {
        setFormError("");

        try {
            setSubmitting(true);

            if (editingId) {
                await api.put(`/document-types/${editingId}`, values);
                flash("Document type updated successfully.");
            } else {
                await api.post("/document-types", values);
                flash("Document type created successfully.");
            }

            handleCancel();
            await fetchDocumentTypes();
        } catch (err) {
            console.error(err);

            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors || {};
                const hasMappedError =
                    applyServerValidationErrors(validationErrors);

                if (!hasMappedError) {
                    setFormError(
                        "Please review the document type information and try again.",
                    );
                }
            } else {
                setFormError(
                    err.response?.data?.message ||
                        "Failed to save document type.",
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (docType) => {
        const confirmDelete = window.confirm(
            `Delete document type "${docType.document_name}"? This cannot be undone.`,
        );

        if (!confirmDelete) return;

        try {
            setBusyId(docType.document_type_id);

            await api.delete(`/document-types/${docType.document_type_id}`);

            flash(`Document type "${docType.document_name}" has been deleted.`);

            await fetchDocumentTypes();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                    "Failed to delete document type.",
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleActive = async (docType) => {
        try {
            setBusyId(docType.document_type_id);

            await api.put(`/document-types/${docType.document_type_id}`, {
                document_name: docType.document_name,
                description: docType.description || "",
                processing_days: docType.processing_days,
                is_active: !docType.is_active,
            });

            await fetchDocumentTypes();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                    "Failed to update document type.",
            );
        } finally {
            setBusyId(null);
        }
    };

    const filtered = documentTypes.filter((docType) => {
        if (!search) return true;

        const needle = search.toLowerCase();

        return [docType.document_name, docType.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle);
    });

    if (loading) {
        return (
            <AdminLayout>
                <AdminPageState>
                    <CircularProgress color="success" size={32} />

                    <p>Loading document types...</p>
                </AdminPageState>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <AdminPageState>
                    <Alert severity="error">{error}</Alert>
                </AdminPageState>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminPage>
                <AdminPageHeader>
                    <DocumentPageHeaderRow>
                        <div>
                            <AdminPageLabel>DOCUMENT TYPES</AdminPageLabel>

                            <h1>Manage Document Types</h1>

                            <p>
                                Create, edit, and manage the document services
                                offered by the barangay to residents and walk-in
                                guests.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="contained"
                            color="success"
                            onClick={() => {
                                if (showForm && !editingId) {
                                    handleCancel();
                                } else {
                                    reset(EMPTY_FORM);
                                    clearErrors();
                                    setEditingId(null);
                                    setShowForm(true);
                                    setFormError("");
                                }
                            }}
                        >
                            {showForm && !editingId
                                ? "Close Form"
                                : "＋ New Document Type"}
                        </Button>
                    </DocumentPageHeaderRow>
                </AdminPageHeader>

                {actionMessage && (
                    <AdminMessages>
                        <Alert severity="success">{actionMessage}</Alert>
                    </AdminMessages>
                )}

                {showForm && (
                    <AdminSection>
                        <DocumentFormTitle>
                            {editingId
                                ? "Edit Document Type"
                                : "New Document Type"}
                        </DocumentFormTitle>

                        <form
                            onSubmit={handleSubmit(submitDocumentType)}
                            noValidate
                        >
                            <DocumentFormGrid>
                                <DocumentFormField>
                                    <Controller
                                        name="document_name"
                                        control={control}
                                        rules={{
                                            required:
                                                "Document name is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="document-name"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Document Name"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.document_name,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.document_name,
                                                        ),
                                                        "aria-describedby":
                                                            errors.document_name
                                                                ? "document-name-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="document-name-error"
                                        error={errors.document_name}
                                    />
                                </DocumentFormField>

                                <DocumentFormField>
                                    <Controller
                                        name="processing_days"
                                        control={control}
                                        rules={{
                                            required:
                                                "Processing days is required.",
                                            min: {
                                                value: 1,
                                                message:
                                                    "Processing days must be at least 1.",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="processing-days"
                                                type="number"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Processing Days"
                                                value={field.value}
                                                onChange={(event) =>
                                                    field.onChange(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.processing_days,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        min: 1,
                                                        "aria-invalid": Boolean(
                                                            errors.processing_days,
                                                        ),
                                                        "aria-describedby":
                                                            errors.processing_days
                                                                ? "processing-days-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="processing-days-error"
                                        error={errors.processing_days}
                                    />
                                </DocumentFormField>

                                <DocumentStatusField>
                                    <Controller
                                        name="is_active"
                                        control={control}
                                        render={({ field }) => (
                                            <DocumentStatusControl
                                                control={
                                                    <DocumentStatusSwitch
                                                        name={field.name}
                                                        checked={field.value}
                                                        onChange={(event) =>
                                                            field.onChange(
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                        inputRef={field.ref}
                                                        color="success"
                                                    />
                                                }
                                                label={
                                                    field.value
                                                        ? "Active"
                                                        : "Inactive"
                                                }
                                            />
                                        )}
                                    />
                                </DocumentStatusField>

                                <DocumentFullField>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                id="document-description"
                                                name={field.name}
                                                fullWidth
                                                multiline
                                                minRows={3}
                                                label="Description"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                            />
                                        )}
                                    />
                                </DocumentFullField>
                            </DocumentFormGrid>

                            {formError && (
                                <FieldValidationError
                                    id="document-type-form-error"
                                    error={formError}
                                />
                            )}

                            <DocumentFormActions>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Saving..."
                                        : editingId
                                          ? "Save Changes"
                                          : "Create Document Type"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outlined"
                                    color="secondary"
                                    disabled={submitting}
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                            </DocumentFormActions>
                        </form>
                    </AdminSection>
                )}

                <AdminSection>
                    <AdminFilterBar>
                        <AdminSearchField
                            type="search"
                            size="small"
                            label="Search Document Types"
                            placeholder="Search by name or description..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <AdminResultsCount>
                            Showing {filtered.length} of {documentTypes.length}{" "}
                            document
                            {documentTypes.length === 1 ? "" : "s"}
                        </AdminResultsCount>
                    </AdminFilterBar>
                </AdminSection>

                <AdminSection>
                    {filtered.length === 0 ? (
                        <AdminEmptyState>
                            <AdminEmptyIcon>📄</AdminEmptyIcon>

                            <h3>No Document Types Found</h3>

                            <p>
                                No document types match the current filters. Use
                                the "New Document Type" button to add one.
                            </p>
                        </AdminEmptyState>
                    ) : (
                        <AdminTableWrapper>
                            <AdminDataTable>
                                <TableHead>
                                    <AdminTableRow>
                                        <AdminTableHeaderCell>
                                            Name
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Description
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Processing Days
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Status
                                        </AdminTableHeaderCell>

                                        <DocumentActionsHeaderCell>
                                            Actions
                                        </DocumentActionsHeaderCell>
                                    </AdminTableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((docType) => (
                                        <AdminTableRow
                                            key={docType.document_type_id}
                                        >
                                            <AdminTableDataCell>
                                                <AdminTablePrimaryText>
                                                    {docType.document_name}
                                                </AdminTablePrimaryText>
                                            </AdminTableDataCell>

                                            <DocumentDescriptionCell>
                                                {docType.description || (
                                                    <AdminMutedText>
                                                        No description
                                                    </AdminMutedText>
                                                )}
                                            </DocumentDescriptionCell>

                                            <AdminTableDataCell>
                                                {docType.processing_days} day
                                                {docType.processing_days === 1
                                                    ? ""
                                                    : "s"}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <StatusBadge
                                                    status={
                                                        docType.is_active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }
                                                />
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <AdminRowActions>
                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        color="success"
                                                        size="small"
                                                        disabled={
                                                            busyId ===
                                                            docType.document_type_id
                                                        }
                                                        onClick={() =>
                                                            handleEdit(docType)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        color={
                                                            docType.is_active
                                                                ? "warning"
                                                                : "success"
                                                        }
                                                        size="small"
                                                        disabled={
                                                            busyId ===
                                                            docType.document_type_id
                                                        }
                                                        onClick={() =>
                                                            handleToggleActive(
                                                                docType,
                                                            )
                                                        }
                                                    >
                                                        {docType.is_active
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        disabled={
                                                            busyId ===
                                                            docType.document_type_id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                docType,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </AdminRowActions>
                                            </AdminTableDataCell>
                                        </AdminTableRow>
                                    ))}
                                </TableBody>
                            </AdminDataTable>
                        </AdminTableWrapper>
                    )}
                </AdminSection>
            </AdminPage>
        </AdminLayout>
    );
}
