import { useEffect, useState } from "react";
<<<<<<< HEAD
=======
import Button from "../../components/ui/Button";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
<<<<<<< HEAD
=======
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

export default function AdminRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
<<<<<<< HEAD

    const fetchRequest = async () => {
        setLoading(true);
        setError("");
=======
    const [submittingStatus, setSubmittingStatus] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

    const fetchRequest = async ({ showLoading = true } = {}) => {
        if (showLoading) {
            setLoading(true);
            setError("");
        }
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

        try {
            let primaryEndpoint = `/barangay-requests/${requestId}`;
            if (type === "guest") {
                primaryEndpoint = `/guest-requests/${requestId}`;
            }

            let response;
            try {
                response = await api.get(primaryEndpoint);
                setRequestType(type || "registered");
            } catch (err) {
                if (!type && err.response?.status === 404) {
                    response = await api.get(
                        `/guest-requests/${requestId}`
                    );
                    setRequestType("guest");
                } else {
                    throw err;
                }
            }

            const data = response.data.data;
            setRequest(data);
            setRemarks(data.remarks || "");
        } catch (err) {
            console.error(err);
<<<<<<< HEAD
            if (err.response?.status === 403) {
                setError("You are not authorized to view this request.");
            } else if (err.response?.status === 404) {
                setError("Request not found.");
            } else {
                setError("Failed to load request details.");
            }
        } finally {
            setLoading(false);
=======
            if (!showLoading) {
                setActionMessage(
                    "Status was updated, but the latest request details could not be refreshed."
                );
            } else {
                if (err.response?.status === 403) {
                    setError("You are not authorized to view this request.");
                } else if (err.response?.status === 404) {
                    setError("Request not found.");
                } else {
                    setError("Failed to load request details.");
                }
            }
        } finally {
            if (showLoading) {
                setLoading(false);
            }
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        }
    };

    useEffect(() => {
        fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, requestId]);

<<<<<<< HEAD
    const handleStatusUpdate = async (newStatus) => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmAction = window.confirm(
            `Change status to "${newStatus}"?`
        );
        if (!confirmAction) return;

        setSubmitting(true);
=======
    const handleStatusUpdate = (newStatus) => {
        setConfirmation({
            title: "Confirm status change",
            message: `Change status to “${newStatus}”?`,
            confirmLabel: `Change to ${newStatus}`,
            variant: newStatus === "Rejected" ? "danger" : "primary",
            action: () => performStatusUpdate(newStatus),
        });
    };

    const performStatusUpdate = async (newStatus) => {
        const endpoint = requestType === "guest" ? `/guest-requests/${requestId}` : `/barangay-requests/${requestId}`;
        setActionMessage("");
        setSubmitting(true);
        setSubmittingStatus(newStatus);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
<<<<<<< HEAD
            await fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg =
                err.response?.data?.message || "Failed to update status.";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this request? This cannot be undone."
        );
        if (!confirmDelete) return;

=======
            setRequest((currentRequest) =>
                currentRequest
                    ? {
                          ...currentRequest,
                          status: newStatus,
                          remarks: remarks || currentRequest.remarks,
                      }
                    : currentRequest
            );
            await fetchRequest({ showLoading: false });
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            setActionMessage(msg);
        } finally {
            setSubmitting(false);
            setSubmittingStatus("");
        }
    };

    const handleDelete = () => {
        setConfirmation({
            title: "Delete request?",
            message: `Delete request ${request.tracking_number || `#${requestId}`}? This cannot be undone.`,
            confirmLabel: "Delete request",
            variant: "danger",
            action: performDelete,
        });
    };

    const performDelete = async () => {
        const endpoint = requestType === "guest" ? `/guest-requests/${requestId}` : `/barangay-requests/${requestId}`;
        setActionMessage("");
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        try {
            await api.delete(endpoint);
            navigate("/admin/requests");
        } catch (err) {
            console.error("Failed to delete request:", err);
<<<<<<< HEAD
            const msg =
                err.response?.data?.message || "Failed to delete request.";
            alert(msg);
=======
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading request details...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
<<<<<<< HEAD
                    <h3 style={{ color: "#991b1b" }}>{error}</h3>
                    <button
=======
                    <h3 className="text-danger-token">{error}</h3>
                    <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        type="button"
                        className="btn btn-outline-secondary mt-3"
                        onClick={() => navigate("/admin/requests")}
                    >
                        ← Back to Manage Requests
<<<<<<< HEAD
                    </button>
=======
                    </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                </div>
            </AdminLayout>
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";
    const idImage = isGuest
        ? request.valid_id_image
        : null;

    const getValidIdImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

<<<<<<< HEAD
    return (
        <AdminLayout>
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
                            <div>
                                <span className="section-label">
                                    REQUEST DETAILS
                                </span>
                                <h1>
                                    {request.tracking_number}
                                </h1>
                                <p>
                                    {isGuest
                                        ? "Guest document request"
                                        : "Registered resident document request"}
                                </p>
                            </div>
                            <StatusBadge status={request.status} />
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-7">
                            <section className="dashboard-section">
                                <div
                                    className="admin-form-card"
                                    style={{ marginBottom: "24px" }}
                                >
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
=======
    const statusButtonContent = (label, status) =>
        submittingStatus === status ? (
            <>
                <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                />
                Saving...
            </>
        ) : (
            label
        );

    return (
        <AdminLayout>
            <div className="admin-dashboard admin-request-details-page">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div className="request-details-header-top">
                            <Button
                                type="button"
                                className="btn btn-request-details-back"
                                onClick={() => navigate("/admin/requests")}
                            >
                                <i
                                    className="bi bi-arrow-left"
                                    aria-hidden="true"
                                />
                                <span>Back to Manage Requests</span>
                            </Button>
                            <StatusBadge status={request.status} />
                        </div>
                        <div className="request-details-heading">
                            <span className="section-label">
                                REQUEST DETAILS
                            </span>
                            <h1>{request.tracking_number}</h1>
                            <p>
                                {isGuest
                                    ? "Guest document request"
                                    : "Registered resident document request"}
                            </p>
                        </div>
                    </div>

                    {actionMessage && <div className="alert alert-danger" role="alert">{actionMessage}</div>}

                    <div className="row g-4">
                        <div className="col-lg-7">
                            <section className="dashboard-section">
                                <div className="admin-form-card detail-card-spaced">
                                    <h3 className="form-section-title">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                        Request Information
                                    </h3>

                                    <div className="detail-grid">
                                        <div>
                                            <span className="detail-label">
                                                Document Type
                                            </span>
                                            <span className="detail-value">
                                                {request.document_type
                                                    ?.document_name ||
                                                    "Unknown"}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Purpose
                                            </span>
                                            <span className="detail-value">
                                                {request.purpose || "—"}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Submitted At
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(request.created_at)}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="detail-label">
                                                Last Updated
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(request.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

<<<<<<< HEAD
                                <div className="admin-form-card">
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
=======
                                <div
                                    className={`admin-form-card${
                                        !isGuest && !request.user
                                            ? " requester-details-empty-card"
                                            : ""
                                    }`}
                                >
                                    <h3 className="form-section-title">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                        Requester Details
                                    </h3>

                                    {!isGuest && request.user && (
                                        <div className="detail-grid">
                                            <div>
                                                <span className="detail-label">
                                                    Name
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.first_name}{" "}
                                                    {request.user.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Username
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.username}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Email
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.email}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Contact
                                                </span>
                                                <span className="detail-value">
                                                    {request.user
                                                        .contact_number || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Address
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.address ||
                                                        "—"}
                                                </span>
                                            </div>
                                        </div>
                                    )}

<<<<<<< HEAD
=======
                                    {!isGuest && !request.user && (
                                        <div
                                            className="requester-details-unavailable"
                                            role="status"
                                        >
                                            <i
                                                className="bi bi-info-circle"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                Resident profile information
                                                is not available for this
                                                request.
                                            </span>
                                        </div>
                                    )}

>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    {isGuest && (
                                        <div className="detail-grid">
                                            <div>
                                                <span className="detail-label">
                                                    Name
                                                </span>
                                                <span className="detail-value">
                                                    {request.first_name}{" "}
                                                    {request.middle_name
                                                        ? `${request.middle_name} `
                                                        : ""}
                                                    {request.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Birth Date
                                                </span>
                                                <span className="detail-value">
                                                    {formatDate(
                                                        request.birth_date
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Gender
                                                </span>
                                                <span className="detail-value">
                                                    {request.gender || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Civil Status
                                                </span>
                                                <span className="detail-value">
                                                    {request.civil_status ||
                                                        "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Contact
                                                </span>
                                                <span className="detail-value">
                                                    {request.contact_number ||
                                                        "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Email
                                                </span>
                                                <span className="detail-value">
                                                    {request.email || "—"}
                                                </span>
                                            </div>
<<<<<<< HEAD
                                            <div
                                                style={{
                                                    gridColumn:
                                                        "1 / -1",
                                                }}
                                            >
=======
                                            <div className="detail-grid-full-row">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                <span className="detail-label">
                                                    Address
                                                </span>
                                                <span className="detail-value">
                                                    {request.address || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Valid ID Type
                                                </span>
                                                <span className="detail-value">
                                                    {request.valid_id_type ||
                                                        "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Valid ID Image
                                                </span>
                                                <span className="detail-value">
                                                    {idImage ? (
                                                        <a
                                                            href={getValidIdImageUrl(
                                                                idImage
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
<<<<<<< HEAD
                                                            style={{
                                                                color: "#166534",
                                                                fontWeight: 600,
                                                            }}
=======
                                                            className="detail-link"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                        >
                                                            View uploaded ID
                                                        </a>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="col-lg-5">
                            <section className="dashboard-section">
                                <div className="admin-form-card">
<<<<<<< HEAD
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
=======
                                    <h3 className="form-section-title">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                        Processing Timeline
                                    </h3>

                                    <ul className="timeline">
                                        <li className="timeline-item done">
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>Submitted</strong>
                                                <div className="timeline-date">
                                                    {formatDate(
                                                        request.created_at
                                                    )}
                                                </div>
                                            </div>
                                        </li>

                                        <li
                                            className={`timeline-item ${
                                                request.approved_at
                                                    ? "done"
                                                    : "pending"
                                            }`}
                                        >
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>Approved</strong>
                                                <div className="timeline-date">
                                                    {formatDate(
                                                        request.approved_at
                                                    )}
                                                </div>
                                            </div>
                                        </li>

                                        <li
                                            className={`timeline-item ${
                                                request.status ===
                                                    "Processing" ||
                                                request.status ===
                                                    "Ready for Pickup" ||
                                                request.status ===
                                                    "Completed" ||
                                                request.ready_for_pickup_at
                                                    ? "done"
                                                    : "pending"
                                            }`}
                                        >
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>Processing</strong>
                                                <div className="timeline-date">
                                                    {request.status ===
                                                        "Processing" &&
                                                        "In progress"}
                                                </div>
                                            </div>
                                        </li>

                                        <li
                                            className={`timeline-item ${
                                                request.ready_for_pickup_at
                                                    ? "done"
                                                    : "pending"
                                            }`}
                                        >
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>Ready for Pickup</strong>
                                                <div className="timeline-date">
                                                    {formatDate(
                                                        request.ready_for_pickup_at
                                                    )}
                                                </div>
                                            </div>
                                        </li>

                                        <li
                                            className={`timeline-item ${
                                                request.claimed_at
                                                    ? "done"
                                                    : "pending"
                                            }`}
                                        >
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>Completed</strong>
                                                <div className="timeline-date">
                                                    {formatDate(
                                                        request.claimed_at
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section className="dashboard-section">
                                <div className="admin-form-card">
<<<<<<< HEAD
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        Update Status
                                    </h3>

                                    <div style={{ marginBottom: "12px" }}>
                                        <label
                                            className="form-label"
                                            style={{ fontWeight: 600 }}
                                        >
=======
                                    <h3 className="form-section-title">
                                        Update Status
                                    </h3>

                                    <div className="detail-form-field">
                                        <label className="form-label fw-semibold">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            Remarks
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={remarks}
<<<<<<< HEAD
=======
                                            disabled={submitting}
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            onChange={(event) =>
                                                setRemarks(event.target.value)
                                            }
                                            placeholder="Optional notes about this status change..."
                                        />
                                    </div>

<<<<<<< HEAD
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {request.status === "Pending" && (
                                            <>
                                                <button
=======
                                    <div className="detail-action-footer">
                                        {request.status === "Pending" && (
                                            <>
                                                <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                    type="button"
                                                    className="btn btn-success"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Approved"
                                                        )
                                                    }
                                                >
<<<<<<< HEAD
                                                    Approve
                                                </button>
                                                <button
=======
                                                    {statusButtonContent(
                                                        "Approve",
                                                        "Approved"
                                                    )}
                                                </Button>
                                                <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                    type="button"
                                                    className="btn btn-danger"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Rejected"
                                                        )
                                                    }
                                                >
<<<<<<< HEAD
                                                    Reject
                                                </button>
=======
                                                    {statusButtonContent(
                                                        "Reject",
                                                        "Rejected"
                                                    )}
                                                </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            </>
                                        )}

                                        {request.status === "Approved" && (
<<<<<<< HEAD
                                            <button
=======
                                            <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Processing"
                                                    )
                                                }
                                            >
<<<<<<< HEAD
                                                Start Processing
                                            </button>
                                        )}

                                        {request.status === "Processing" && (
                                            <button
=======
                                                {statusButtonContent(
                                                    "Start Processing",
                                                    "Processing"
                                                )}
                                            </Button>
                                        )}

                                        {request.status === "Processing" && (
                                            <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                type="button"
                                                className="btn btn-info"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Ready for Pickup"
                                                    )
                                                }
                                            >
<<<<<<< HEAD
                                                Mark Ready for Pickup
                                            </button>
=======
                                                {statusButtonContent(
                                                    "Mark Ready for Pickup",
                                                    "Ready for Pickup"
                                                )}
                                            </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                        )}

                                        {request.status ===
                                            "Ready for Pickup" && (
<<<<<<< HEAD
                                            <button
=======
                                            <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                type="button"
                                                className="btn btn-success"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Completed"
                                                    )
                                                }
                                            >
<<<<<<< HEAD
                                                Mark Completed
                                            </button>
=======
                                                {statusButtonContent(
                                                    "Mark Completed",
                                                    "Completed"
                                                )}
                                            </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                        )}

                                        {(request.status === "Rejected" ||
                                            request.status === "Completed") && (
<<<<<<< HEAD
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: "#6b7280",
                                                }}
                                            >
=======
                                            <p className="final-status-note">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                This request is in a final
                                                status. No further transitions
                                                are allowed.
                                            </p>
                                        )}

<<<<<<< HEAD
                                        <button
=======
                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            type="button"
                                            className="btn btn-outline-danger ms-auto"
                                            disabled={submitting}
                                            onClick={handleDelete}
                                        >
                                            Delete Request
<<<<<<< HEAD
                                        </button>
=======
                                        </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    </div>
                                </div>
                            </section>

<<<<<<< HEAD
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => navigate("/admin/requests")}
                            >
                                ← Back to Manage Requests
                            </button>
=======
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                        </div>
                    </div>
                </div>
            </div>
<<<<<<< HEAD
=======
            <ConfirmDialog
                isOpen={Boolean(confirmation)}
                onClose={() => setConfirmation(null)}
                onConfirm={() => {
                    const action = confirmation?.action;
                    setConfirmation(null);
                    if (action) action();
                }}
                title={confirmation?.title}
                confirmLabel={confirmation?.confirmLabel}
                variant={confirmation?.variant}
            >
                {confirmation?.message}
            </ConfirmDialog>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        </AdminLayout>
    );
}
