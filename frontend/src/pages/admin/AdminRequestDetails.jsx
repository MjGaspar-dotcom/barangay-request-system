import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";

export default function AdminRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchRequest = async () => {
        setLoading(true);
        setError("");

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
            if (err.response?.status === 403) {
                setError("You are not authorized to view this request.");
            } else if (err.response?.status === 404) {
                setError("Request not found.");
            } else {
                setError("Failed to load request details.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, requestId]);

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
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
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

        try {
            await api.delete(endpoint);
            navigate("/admin/requests");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg =
                err.response?.data?.message || "Failed to delete request.";
            alert(msg);
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
                    <h3 style={{ color: "#991b1b" }}>{error}</h3>
                    <button
                        type="button"
                        className="btn btn-outline-secondary mt-3"
                        onClick={() => navigate("/admin/requests")}
                    >
                        ← Back to Manage Requests
                    </button>
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

                                <div className="admin-form-card">
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
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
                                            <div
                                                style={{
                                                    gridColumn:
                                                        "1 / -1",
                                                }}
                                            >
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
                                                            style={{
                                                                color: "#166534",
                                                                fontWeight: 600,
                                                            }}
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
                                    <h3
                                        style={{
                                            color: "#14532d",
                                            marginBottom: "16px",
                                        }}
                                    >
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
                                            Remarks
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={remarks}
                                            onChange={(event) =>
                                                setRemarks(event.target.value)
                                            }
                                            placeholder="Optional notes about this status change..."
                                        />
                                    </div>

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
                                                    type="button"
                                                    className="btn btn-success"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Approved"
                                                        )
                                                    }
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Rejected"
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {request.status === "Approved" && (
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Processing"
                                                    )
                                                }
                                            >
                                                Start Processing
                                            </button>
                                        )}

                                        {request.status === "Processing" && (
                                            <button
                                                type="button"
                                                className="btn btn-info"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Ready for Pickup"
                                                    )
                                                }
                                            >
                                                Mark Ready for Pickup
                                            </button>
                                        )}

                                        {request.status ===
                                            "Ready for Pickup" && (
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Completed"
                                                    )
                                                }
                                            >
                                                Mark Completed
                                            </button>
                                        )}

                                        {(request.status === "Rejected" ||
                                            request.status === "Completed") && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: "#6b7280",
                                                }}
                                            >
                                                This request is in a final
                                                status. No further transitions
                                                are allowed.
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-outline-danger ms-auto"
                                            disabled={submitting}
                                            onClick={handleDelete}
                                        >
                                            Delete Request
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => navigate("/admin/requests")}
                            >
                                ← Back to Manage Requests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
