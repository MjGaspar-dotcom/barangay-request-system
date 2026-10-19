import { useEffect, useState } from "react";
<<<<<<< HEAD
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

import { validateForm } from "../../utils/validateForm";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
const EMPTY_FORM = {
    document_name: "",
    description: "",
    processing_days: 1,
    is_active: true,
};

export default function ManageDocumentTypes() {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [showForm, setShowForm] = useState(false);
<<<<<<< HEAD
=======
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionMessageType, setActionMessageType] = useState("success");
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

    const fetchDocumentTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get("/document-types");
            setDocumentTypes(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load document types.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    const flash = (message) => {
<<<<<<< HEAD
=======
        setActionMessageType("success");
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        setActionMessage(message);
        window.setTimeout(() => setActionMessage(""), 4000);
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "processing_days"
<<<<<<< HEAD
                    ? Number(value)
                    : value,
=======
                      ? Number(value)
                      : value,
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        }));
    };

    const handleEdit = (docType) => {
        setForm({
            document_name: docType.document_name,
            description: docType.description || "",
            processing_days: docType.processing_days,
            is_active: Boolean(docType.is_active),
        });
        setEditingId(docType.document_type_id);
        setShowForm(true);
        setFormError("");
    };

    const handleCancel = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        setFormError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
<<<<<<< HEAD
=======

        if (!validateForm(event.currentTarget)) return;
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        setFormError("");

        try {
            setSubmitting(true);

            if (editingId) {
                await api.put(`/document-types/${editingId}`, form);
                flash("Document type updated successfully.");
            } else {
                await api.post("/document-types", form);
                flash("Document type created successfully.");
            }

            handleCancel();
            await fetchDocumentTypes();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 422) {
                const errors = err.response.data.errors || {};
                const firstKey = Object.keys(errors)[0];
                setFormError(
                    firstKey
                        ? errors[firstKey][0]
<<<<<<< HEAD
                        : "Please check the form for errors."
=======
                        : "Please check the form for errors.",
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                );
            } else {
                setFormError(
                    err.response?.data?.message ||
<<<<<<< HEAD
                        "Failed to save document type."
=======
                        "Failed to save document type.",
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (docType) => {
<<<<<<< HEAD
        const confirmDelete = window.confirm(
            `Delete document type "${docType.document_name}"? This cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            setBusyId(docType.document_type_id);
            await api.delete(
                `/document-types/${docType.document_type_id}`
            );
=======
        try {
            setBusyId(docType.document_type_id);
            await api.delete(`/document-types/${docType.document_type_id}`);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
            flash(`Document type "${docType.document_name}" has been deleted.`);
            await fetchDocumentTypes();
        } catch (err) {
            console.error(err);
<<<<<<< HEAD
            alert(
                err.response?.data?.message ||
                    "Failed to delete document type."
=======
            setActionMessageType("danger");
            setActionMessage(
                err.response?.data?.message ||
                    "Failed to delete document type.",
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
            alert(
                err.response?.data?.message ||
                    "Failed to update document type."
=======
            setActionMessageType("danger");
            setActionMessage(
                err.response?.data?.message ||
                    "Failed to update document type.",
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
                <div className="page-loading">
<<<<<<< HEAD
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
=======
                    <div className="spinner-border text-success" role="status">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading document types...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
<<<<<<< HEAD
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: "12px",
                            }}
                        >
=======
            <div className="admin-dashboard manage-document-types-page">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div className="page-header-row document-types-header-row">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            <div>
                                <span className="section-label">
                                    DOCUMENT TYPES
                                </span>

                                <h1>Manage Document Types</h1>

                                <p>
                                    Create, edit, and manage the document
                                    services offered by the barangay to
                                    residents and walk-in guests.
                                </p>
                            </div>

<<<<<<< HEAD
                            <button
                                type="button"
                                className="btn btn-success"
=======
                            <Button
                                type="button"
                                className="btn btn-success document-type-create-button"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                onClick={() => {
                                    if (showForm && !editingId) {
                                        handleCancel();
                                    } else {
                                        setForm(EMPTY_FORM);
                                        setEditingId(null);
                                        setShowForm(true);
                                    }
                                    setFormError("");
                                }}
                            >
                                {showForm && !editingId
                                    ? "Close Form"
                                    : "＋ New Document Type"}
<<<<<<< HEAD
                            </button>
=======
                            </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        </div>
                    </div>

                    {actionMessage && (
                        <div
<<<<<<< HEAD
                            className="alert alert-success"
=======
                            className={`alert alert-${actionMessageType}`}
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            role="alert"
                        >
                            {actionMessage}
                        </div>
                    )}

                    {showForm && (
                        <section className="dashboard-section">
                            <div className="admin-form-card">
<<<<<<< HEAD
                                <h3
                                    style={{
                                        marginBottom: "20px",
                                        color: "#14532d",
                                    }}
                                >
=======
                                <h3 className="form-section-title mb-5-token">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    {editingId
                                        ? "Edit Document Type"
                                        : "New Document Type"}
                                </h3>

<<<<<<< HEAD
                                <form onSubmit={handleSubmit}>
=======
                                <form noValidate onSubmit={handleSubmit}>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Document Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="document_name"
                                                className="form-control"
                                                value={form.document_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">
                                                Processing Days *
                                            </label>
                                            <input
                                                type="number"
                                                name="processing_days"
                                                className="form-control"
                                                value={form.processing_days}
                                                onChange={handleChange}
                                                min={1}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">
                                                Status
                                            </label>
<<<<<<< HEAD
                                            <div
                                                className="form-check form-switch"
                                                style={{
                                                    paddingTop: "8px",
                                                }}
                                            >
=======
                                            <div className="form-check form-switch form-switch-spaced">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    className="form-check-input"
                                                    checked={form.is_active}
                                                    onChange={handleChange}
                                                    id="is_active"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="is_active"
                                                >
                                                    {form.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                className="form-control"
                                                rows={3}
                                                value={form.description}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {formError && (
                                        <div
                                            className="alert alert-danger mt-3"
                                            role="alert"
                                        >
                                            {formError}
                                        </div>
                                    )}

<<<<<<< HEAD
                                    <div
                                        style={{
                                            marginTop: "20px",
                                            display: "flex",
                                            gap: "10px",
                                        }}
                                    >
                                        <button
=======
                                    <div className="form-actions-row">
                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Saving..."
                                                : editingId
<<<<<<< HEAD
                                                ? "Save Changes"
                                                : "Create Document Type"}
                                        </button>

                                        <button
=======
                                                  ? "Save Changes"
                                                  : "Create Document Type"}
                                        </Button>

                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCancel}
                                            disabled={submitting}
                                        >
                                            Cancel
<<<<<<< HEAD
                                        </button>
=======
                                        </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    <section className="dashboard-section">
<<<<<<< HEAD
                        <div
                            className="admin-filters"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                className="form-control"
=======
                        <div className="admin-filters filter-bar">
                            <input
                                type="search"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                placeholder="Search by name or description..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "360px", flex: "1 1 280px" }}
                            />

                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
                            >
=======
                                className="form-control filter-search"
                            />

                            <div className="filter-summary">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                Showing {filtered.length} of{" "}
                                {documentTypes.length} document
                                {documentTypes.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
<<<<<<< HEAD
                                    📄
                                </div>
                                <h3>No Document Types Found</h3>
                                <p>
                                    No document types match the current
                                    filters. Use the "New Document Type"
                                    button to add one.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="admin-table-wrapper"
                                style={{ overflowX: "auto" }}
                            >
                                <table className="admin-table">
=======
                                    <i
                                        className="bi bi-file-earmark-text"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3>No Document Types Found</h3>
                                <p>
                                    No document types match the current filters.
                                    Use the "New Document Type" button to add
                                    one.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-table-wrapper table-scroll">
                                <Table className="admin-table data-table">
                                    <colgroup>
                                        <col className="document-type-name-column" />
                                        <col className="document-type-description-column" />
                                        <col className="document-type-days-column" />
                                        <col className="document-type-status-column" />
                                        <col className="document-type-actions-column" />
                                    </colgroup>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
<<<<<<< HEAD
                                            <th>Processing Days</th>
                                            <th>Status</th>
                                            <th style={{ minWidth: "260px" }}>
=======
                                            <th className="document-type-days-heading">
                                                Processing Days
                                            </th>
                                            <th className="document-type-status-heading">
                                                Status
                                            </th>
                                            <th className="table-actions-heading document-type-actions-heading">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((docType) => (
                                            <tr key={docType.document_type_id}>
                                                <td>
                                                    <strong>
                                                        {docType.document_name}
                                                    </strong>
                                                </td>
<<<<<<< HEAD
                                                <td
                                                    style={{
                                                        maxWidth: "320px",
                                                    }}
                                                >
                                                    {docType.description || (
                                                        <span
                                                            style={{
                                                                color: "#9ca3af",
                                                            }}
                                                        >
=======
                                                <td className="document-description-cell">
                                                    {docType.description || (
                                                        <span className="text-muted-token">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            No description
                                                        </span>
                                                    )}
                                                </td>
<<<<<<< HEAD
                                                <td>
=======
                                                <td className="document-type-days-cell">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                    {docType.processing_days}{" "}
                                                    day
                                                    {docType.processing_days ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </td>
<<<<<<< HEAD
                                                <td>
                                                    {docType.is_active ? (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "2px 10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#dcfce7",
                                                                color: "#166534",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "2px 10px",
                                                                borderRadius:
                                                                    "999px",
                                                                backgroundColor:
                                                                    "#fee2e2",
                                                                color: "#991b1b",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
=======
                                                <td className="document-type-status-cell">
                                                    {docType.is_active ? (
                                                        <span className="document-status-badge is-active">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="document-status-badge is-inactive">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
<<<<<<< HEAD
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "6px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <button
=======
                                                <td className="document-type-actions-cell">
                                                    <div className="table-action-group document-type-action-group">
                                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            type="button"
                                                            className="btn btn-outline-success btn-sm"
                                                            disabled={
                                                                busyId ===
                                                                docType.document_type_id
                                                            }
                                                            onClick={() =>
                                                                handleEdit(
<<<<<<< HEAD
                                                                    docType
=======
                                                                    docType,
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                                )
                                                            }
                                                        >
                                                            Edit
<<<<<<< HEAD
                                                        </button>

                                                        <button
=======
                                                        </Button>

                                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            type="button"
                                                            className={`btn btn-sm ${
                                                                docType.is_active
                                                                    ? "btn-outline-warning"
                                                                    : "btn-outline-success"
                                                            }`}
                                                            disabled={
                                                                busyId ===
                                                                docType.document_type_id
                                                            }
                                                            onClick={() =>
                                                                handleToggleActive(
<<<<<<< HEAD
                                                                    docType
=======
                                                                    docType,
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                                )
                                                            }
                                                        >
                                                            {docType.is_active
                                                                ? "Deactivate"
                                                                : "Activate"}
<<<<<<< HEAD
                                                        </button>

                                                        <button
=======
                                                        </Button>

                                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            disabled={
                                                                busyId ===
                                                                docType.document_type_id
                                                            }
                                                            onClick={() =>
<<<<<<< HEAD
                                                                handleDelete(
                                                                    docType
=======
                                                                setDeleteTarget(
                                                                    docType,
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                                )
                                                            }
                                                        >
                                                            Delete
<<<<<<< HEAD
                                                        </button>
=======
                                                        </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
<<<<<<< HEAD
                                </table>
=======
                                </Table>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </div>
                        )}
                    </section>
                </div>
            </div>
<<<<<<< HEAD
=======
            <ConfirmDialog
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    const target = deleteTarget;
                    setDeleteTarget(null);
                    if (target) handleDelete(target);
                }}
                title="Delete document type?"
                confirmLabel="Delete document type"
                variant="danger"
            >
                Delete document type “{deleteTarget?.document_name}”? This
                cannot be undone.
            </ConfirmDialog>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        </AdminLayout>
    );
}
