import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";

function StaffRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

    const fetchRequest = useCallback(async () => {
        try {
            const response = await api.get(`/barangay-requests/${requestId}`);
            setRequestType(type || "registered");
            setError("");

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
    }, [requestId, type]);

    useEffect(() => {
        const loadRequest = async () => {
            await fetchRequest();
        };

        loadRequest();
    }, [fetchRequest]);

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
        const endpoint = `/barangay-requests/${requestId}`;
        setActionMessage("");
        setSubmitting(true);
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
            setActionMessage(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            setActionMessage(msg);
        } finally {
            setSubmitting(false);
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
        const endpoint = `/barangay-requests/${requestId}`;
        setActionMessage("");
        try {
            await api.delete(endpoint);
            navigate("/staff/queue");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
        }
    };

    if (loading) {
        return (
            <StaffLayout>
                <div className="page-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div><p>Loading request details...</p></div>
            </StaffLayout>
        );
    }

    if (error) {
        return (
            <StaffLayout>
                <div className="alert alert-danger detail-error-state" role="alert">
                    <p>{error}</p>
                    <Button className="btn btn-outline-secondary" onClick={() => navigate("/staff/queue")}>
                        Back to Request Queue
                    </Button>
                </div>
            </StaffLayout>
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";
    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };

    return (
        <StaffLayout>
            <main className="staff-request-details-page admin-dashboard">
                <div className="staff-request-details-content">
                    {actionMessage && (
                        <div className="alert alert-info" role="status">
                            {actionMessage}
                        </div>
                    )}
                    <header className="dashboard-page-header staff-request-header">
                        <div className="staff-request-header-top">
                            <Button
                                type="button"
                                className="btn btn-staff-request-back"
                                onClick={() => navigate("/staff/queue")}
                            >
                                <i
                                    className="bi bi-arrow-left"
                                    aria-hidden="true"
                                />
                                Back to Request Queue
                            </Button>
                            <StatusBadge status={request.status} />
                        </div>
                        <div className="staff-request-header-copy">
                            <span className="section-label">
                                REQUEST DETAILS
                            </span>
                            <h1>
                                {request.tracking_number || "Request Details"}
                            </h1>
                            <p>
                                {isGuest
                                    ? "Guest document request"
                                    : "Registered resident document request"}
                            </p>
                        </div>
                    </header>

                    <div className="row g-3">
                        <section className="col-lg-6">
                            <div className="admin-form-card staff-detail-card">
                                <h2 className="form-section-title">
                                    Request Information
                                </h2>
                                <div className="detail-grid">
                                    <div>
                                        <span className="detail-label">
                                            Tracking Number
                                        </span>
                                        <span className="detail-value">
                                            {request.tracking_number || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="detail-label">
                                            Request Type
                                        </span>
                                        <span className="detail-value">
                                            {isGuest
                                                ? "Guest Request"
                                                : "Registered Resident Request"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="detail-label">
                                            Document
                                        </span>
                                        <span className="detail-value">
                                            {request.document_type
                                                ?.document_name || "Unknown"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="detail-label">
                                            Status
                                        </span>
                                        <span className="detail-value">
                                            <StatusBadge
                                                status={request.status}
                                            />
                                        </span>
                                    </div>
                                    <div className="detail-grid-full-row">
                                        <span className="detail-label">
                                            Purpose
                                        </span>
                                        <span className="detail-value">
                                            {request.purpose || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="col-lg-6">
                            <div className="admin-form-card staff-detail-card">
                                <h2 className="form-section-title">
                                    Requester Details
                                </h2>
                                <div className="detail-grid">
                                    {!isGuest && request.user && (
                                        <>
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
                                                    Email
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.email || "—"}
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
                                        </>
                                    )}
                                    {!isGuest && !request.user && (
                                        <p className="staff-requester-unavailable detail-grid-full-row">
                                            Resident profile information is
                                            unavailable.
                                        </p>
                                    )}
                                    {isGuest && (
                                        <>
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
                                                        request.birth_date,
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
                                            <div className="detail-grid-full-row">
                                                <span className="detail-label">
                                                    Address
                                                </span>
                                                <span className="detail-value">
                                                    {request.address || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Contact Number
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
                                            <div>
                                                <span className="detail-label">
                                                    Valid ID Type
                                                </span>
                                                <span className="detail-value">
                                                    {request.valid_id_type ||
                                                        "—"}
                                                </span>
                                            </div>
                                            {request.valid_id_image && (
                                                <div>
                                                    <span className="detail-label">
                                                        Valid ID Image
                                                    </span>
                                                    <span className="detail-value">
                                                        <a
                                                            href={`http://127.0.0.1:8000/storage/${request.valid_id_image}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="staff-request-id-link"
                                                        >
                                                            View submitted ID
                                                        </a>
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="col-12">
                            <div className="admin-form-card staff-detail-card">
                                <h2 className="form-section-title">
                                    Timestamps &amp; Remarks
                                </h2>
                                <div className="detail-grid staff-request-timestamps">
                                    <div>
                                        <span className="detail-label">
                                            Submitted
                                        </span>
                                        <span className="detail-value">
                                            {formatDate(request.created_at)}
                                        </span>
                                    </div>
                                    {request.approved_at && (
                                        <div>
                                            <span className="detail-label">
                                                Approved At
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(
                                                    request.approved_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {request.ready_for_pickup_at && (
                                        <div>
                                            <span className="detail-label">
                                                Ready for Pickup At
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(
                                                    request.ready_for_pickup_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {request.claimed_at && (
                                        <div>
                                            <span className="detail-label">
                                                Claimed/Completed At
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(
                                                    request.claimed_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-form-field">
                                    <label
                                        className="form-label fw-semibold"
                                        htmlFor="staff-request-remarks"
                                    >
                                        Remarks / Processing Notes
                                    </label>
                                    <textarea
                                        id="staff-request-remarks"
                                        className="form-control"
                                        rows={3}
                                        value={remarks}
                                        onChange={(event) =>
                                            setRemarks(event.target.value)
                                        }
                                        placeholder="Enter optional remarks before changing status"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="col-12">
                            <div className="admin-form-card staff-detail-card">
                                <h2 className="form-section-title">Actions</h2>
                                <div className="detail-action-footer">
                                    {request.status === "Pending" && (
                                        <>
                                            <Button
                                                type="button"
                                                className="btn btn-success"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Approved",
                                                    )
                                                }
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Rejected",
                                                    )
                                                }
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {request.status === "Approved" && (
                                        <Button
                                            type="button"
                                            className="btn btn-success"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    "Processing",
                                                )
                                            }
                                        >
                                            Start Processing
                                        </Button>
                                    )}
                                    {request.status === "Processing" && (
                                        <Button
                                            type="button"
                                            className="btn btn-success"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    "Ready for Pickup",
                                                )
                                            }
                                        >
                                            Ready for Pickup
                                        </Button>
                                    )}
                                    {request.status === "Ready for Pickup" && (
                                        <Button
                                            type="button"
                                            className="btn btn-success"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate("Completed")
                                            }
                                        >
                                            Mark Completed
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        className="btn btn-outline-danger ms-auto"
                                        disabled={submitting}
                                        onClick={handleDelete}
                                    >
                                        Delete Request
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
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
            </main>
        </StaffLayout>
    );
}

export default StaffRequestDetails;
