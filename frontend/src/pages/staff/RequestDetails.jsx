import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
<<<<<<< Updated upstream
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
=======
import PortalLayout from "../../layouts/PortalLayout";
import StatusBadge from "../../components/ui/StatusBadge";

/*
|--------------------------------------------------------------------------
| Staff Request Details
|--------------------------------------------------------------------------
| Full detail view for a single barangay or guest request.
| Staff can update the status through the lifecycle and delete the request.
|--------------------------------------------------------------------------
*/

const navigationItems = [
    { label: "Dashboard", to: "/staff/dashboard", icon: "▦" },
    { label: "All Requests", to: "/staff/requests", icon: "📋" },
];

const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "—";

const getStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const appUrl = (api.defaults.baseURL || window.location.origin).replace(
        /\/api\/?$/,
        ""
    );
    return `${appUrl}/storage/${path.replace(/^\/+/, "")}`;
};
>>>>>>> Stashed changes

function StaffRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
<<<<<<< Updated upstream
<<<<<<< HEAD
=======
    const [confirmation, setConfirmation] = useState(null);
    const [actionMessage, setActionMessage] = useState("");
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
=======
    const [flashMessage, setFlashMessage] = useState("");
    const [flashError, setFlashError] = useState("");

    const flash = (msg, isError = false) => {
        if (isError) {
            setFlashError(msg);
            setFlashMessage("");
        } else {
            setFlashMessage(msg);
            setFlashError("");
        }
        setTimeout(() => {
            setFlashMessage("");
            setFlashError("");
        }, 4000);
    };
>>>>>>> Stashed changes

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
                    response = await api.get(`/guest-requests/${requestId}`);
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
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        setSubmitting(true);
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
<<<<<<< Updated upstream
<<<<<<< HEAD
            alert(`Status updated to ${newStatus}.`);
            fetchRequest();
=======
            flash(`Status updated to "${newStatus}" successfully.`);
            await fetchRequest();
>>>>>>> Stashed changes
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg =
                err.response?.data?.message || "Failed to update status.";
<<<<<<< Updated upstream
            alert(msg);
=======
            setActionMessage(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            setActionMessage(msg);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
=======
            flash(msg, true);
>>>>>>> Stashed changes
        } finally {
            setSubmitting(false);
        }
    };

<<<<<<< HEAD
    const handleDelete = async () => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this request? This cannot be undone."
        );
        if (!confirmDelete) return;

        setSubmitting(true);
        try {
            await api.delete(endpoint);
            navigate("/staff/requests");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg =
                err.response?.data?.message || "Failed to delete request.";
<<<<<<< Updated upstream
            alert(msg);
=======
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
        try {
            await api.delete(endpoint);
            navigate("/staff/queue");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
=======
            flash(msg, true);
        } finally {
            setSubmitting(false);
>>>>>>> Stashed changes
        }
    };

    if (loading) {
        return (
<<<<<<< Updated upstream
            <StaffLayout>
                <div className="page-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div><p>Loading request details...</p></div>
            </StaffLayout>
=======
            <PortalLayout
                portalLabel="STAFF SERVICES"
                sidebarItems={navigationItems}
            >
                <section className="staff-portal">
                    <div className="staff-loading-state">
                        <div className="staff-empty-icon">⏳</div>
                        <p>Loading request details…</p>
                    </div>
                </section>
            </PortalLayout>
>>>>>>> Stashed changes
        );
    }

    if (error) {
        return (
<<<<<<< Updated upstream
<<<<<<< HEAD
            <div>
                <p>{error}</p>
                <button onClick={() => navigate("/staff/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
=======
            <StaffLayout>
                <div className="alert alert-danger detail-error-state" role="alert">
                    <p>{error}</p>
                    <Button className="btn btn-outline-secondary" onClick={() => navigate("/staff/queue")}>
                        Back to Request Queue
                    </Button>
                </div>
            </StaffLayout>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
=======
            <PortalLayout
                portalLabel="STAFF SERVICES"
                sidebarItems={navigationItems}
            >
                <section className="staff-portal">
                    <div className="staff-loading-state">
                        <div className="staff-empty-icon">⚠️</div>
                        <h3 style={{ color: "#991b1b", marginBottom: 8 }}>
                            {error}
                        </h3>
                        <button
                            type="button"
                            className="staff-back-btn"
                            onClick={() => navigate("/staff/requests")}
                        >
                            ← Back to All Requests
                        </button>
                    </div>
                </section>
            </PortalLayout>
>>>>>>> Stashed changes
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";
<<<<<<< Updated upstream
<<<<<<< HEAD
=======
    const idImages = (
        isGuest
            ? [{ label: "Uploaded Valid ID", path: request.valid_id_image }]
            : [
                  {
                      label: "Front of Valid ID",
                      path: request.user?.valid_id_front,
                  },
                  {
                      label: "Back of Valid ID",
                      path: request.user?.valid_id_back,
                  },
              ]
    ).filter((image) => image.path);

    const isFinal =
        request.status === "Completed" || request.status === "Rejected";
>>>>>>> Stashed changes

    return (
        <PortalLayout
            portalLabel="STAFF SERVICES"
            sidebarItems={navigationItems}
        >
            <section className="staff-portal">

                {/* ── Back + Header ── */}
                <button
                    type="button"
                    className="staff-back-btn"
                    onClick={() => navigate("/staff/requests")}
                >
                    ← All Requests
                </button>

<<<<<<< Updated upstream
            <button onClick={() => navigate("/staff/dashboard")}>
                Back to Dashboard
            </button>
        </div>
=======
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
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
=======
                <div className="staff-detail-header">
                    <div>
                        <span className="staff-section-label">
                            REQUEST DETAILS
                        </span>
                        <h1 style={{ marginTop: 4 }}>
                            {request.tracking_number}
                        </h1>
                        <p>
                            {isGuest
                                ? "Walk-in guest document request"
                                : "Registered resident document request"}
                        </p>
                    </div>
                    <StatusBadge status={request.status} />
                </div>

                {/* ── Flash messages ── */}
                {flashMessage && (
                    <div className="staff-flash staff-flash-success">
                        {flashMessage}
                    </div>
                )}
                {flashError && (
                    <div className="staff-flash staff-flash-error">
                        {flashError}
                    </div>
                )}

                {/* ── Two-column body ── */}
                <div className="staff-detail-grid">

                    {/* ── Left column ── */}
                    <div className="staff-detail-col">

                        {/* Request info */}
                        <div className="staff-work-card" style={{ marginBottom: 12 }}>
                            <div className="staff-detail-section-title">
                                Request Information
                            </div>
                            <div className="staff-detail-fields">
                                <div className="staff-detail-field">
                                    <span className="staff-detail-label">
                                        Document Type
                                    </span>
                                    <span className="staff-detail-value">
                                        {request.document_type?.document_name ||
                                            "Unknown"}
                                    </span>
                                </div>
                                <div className="staff-detail-field">
                                    <span className="staff-detail-label">
                                        Purpose
                                    </span>
                                    <span className="staff-detail-value">
                                        {request.purpose || "—"}
                                    </span>
                                </div>
                                <div className="staff-detail-field">
                                    <span className="staff-detail-label">
                                        Submitted
                                    </span>
                                    <span className="staff-detail-value">
                                        {formatDate(request.created_at)}
                                    </span>
                                </div>
                                <div className="staff-detail-field">
                                    <span className="staff-detail-label">
                                        Last Updated
                                    </span>
                                    <span className="staff-detail-value">
                                        {formatDate(request.updated_at)}
                                    </span>
                                </div>
                                {request.remarks && (
                                    <div className="staff-detail-field" style={{ gridColumn: "1 / -1" }}>
                                        <span className="staff-detail-label">
                                            Remarks
                                        </span>
                                        <span className="staff-detail-value">
                                            {request.remarks}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Requester details */}
                        <div className="staff-work-card">
                            <div className="staff-detail-section-title">
                                Requester Details
                            </div>

                            {!isGuest && request.user && (
                                <div className="staff-detail-fields">
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Name</span>
                                        <span className="staff-detail-value">
                                            {[
                                                request.user.first_name,
                                                request.user.middle_name,
                                                request.user.last_name,
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Birth Date</span>
                                        <span className="staff-detail-value">
                                            {request.user.birth_date
                                                ? new Date(
                                                      request.user.birth_date
                                                  ).toLocaleDateString()
                                                : "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Gender</span>
                                        <span className="staff-detail-value">
                                            {request.user.gender || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Civil Status</span>
                                        <span className="staff-detail-value">
                                            {request.user.civil_status || "—"}
                                        </span>
                                    </div>
                                    {request.user.username && (
                                        <div className="staff-detail-field">
                                            <span className="staff-detail-label">Username</span>
                                            <span className="staff-detail-value">
                                                {request.user.username}
                                            </span>
                                        </div>
                                    )}
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Email</span>
                                        <span className="staff-detail-value">
                                            {request.user.email}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Contact</span>
                                        <span className="staff-detail-value">
                                            {request.user.contact_number || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field" style={{ gridColumn: "1 / -1" }}>
                                        <span className="staff-detail-label">Address</span>
                                        <span className="staff-detail-value">
                                            {request.user.address || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Valid ID Type</span>
                                        <span className="staff-detail-value">
                                            {request.user.valid_id_type || "—"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isGuest && (
                                <div className="staff-detail-fields">
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Name</span>
                                        <span className="staff-detail-value">
                                            {request.first_name}{" "}
                                            {request.middle_name
                                                ? `${request.middle_name} `
                                                : ""}
                                            {request.last_name}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Birth Date</span>
                                        <span className="staff-detail-value">
                                            {formatDate(request.birth_date)}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Gender</span>
                                        <span className="staff-detail-value">
                                            {request.gender || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Civil Status</span>
                                        <span className="staff-detail-value">
                                            {request.civil_status || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Contact</span>
                                        <span className="staff-detail-value">
                                            {request.contact_number || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Email</span>
                                        <span className="staff-detail-value">
                                            {request.email || "—"}
                                        </span>
                                    </div>
                                    <div
                                        className="staff-detail-field"
                                        style={{ gridColumn: "1 / -1" }}
                                    >
                                        <span className="staff-detail-label">Address</span>
                                        <span className="staff-detail-value">
                                            {request.address || "—"}
                                        </span>
                                    </div>
                                    <div className="staff-detail-field">
                                        <span className="staff-detail-label">Valid ID Type</span>
                                        <span className="staff-detail-value">
                                            {request.valid_id_type || "—"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 18 }}>
                                <div className="staff-detail-label">
                                    Uploaded ID Images
                                </div>
                                {idImages.length ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 16,
                                            marginTop: 10,
                                        }}
                                    >
                                        {idImages.map(({ label, path }) => (
                                            <a
                                                key={label}
                                                href={getStorageUrl(path)}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: "block",
                                                    maxWidth: 320,
                                                    color: "#166534",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "block",
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    {label} ↗
                                                </span>
                                                <img
                                                    src={getStorageUrl(path)}
                                                    alt={label}
                                                    style={{
                                                        display: "block",
                                                        width: "100%",
                                                        maxHeight: 220,
                                                        objectFit: "contain",
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: 8,
                                                        background: "#f9fafb",
                                                    }}
                                                />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ marginTop: 8, color: "#6b7280" }}>
                                        No ID images uploaded.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right column ── */}
                    <div className="staff-detail-col">

                        {/* Processing Timeline */}
                        <div className="staff-work-card" style={{ marginBottom: 12 }}>
                            <div className="staff-detail-section-title">
                                Processing Timeline
                            </div>
                            <ul className="staff-timeline">
                                <li className="staff-timeline-item done">
                                    <span className="staff-timeline-dot" />
                                    <div>
                                        <strong>Submitted</strong>
                                        <div className="staff-timeline-date">
                                            {formatDate(request.created_at)}
                                        </div>
                                    </div>
                                </li>

                                <li
                                    className={`staff-timeline-item ${
                                        request.approved_at ? "done" : "pending"
                                    }`}
                                >
                                    <span className="staff-timeline-dot" />
                                    <div>
                                        <strong>Approved</strong>
                                        <div className="staff-timeline-date">
                                            {formatDate(request.approved_at)}
                                        </div>
                                    </div>
                                </li>

                                <li
                                    className={`staff-timeline-item ${
                                        request.status === "Processing" ||
                                        request.status === "Ready for Pickup" ||
                                        request.status === "Completed" ||
                                        request.ready_for_pickup_at
                                            ? "done"
                                            : "pending"
                                    }`}
                                >
                                    <span className="staff-timeline-dot" />
                                    <div>
                                        <strong>Processing</strong>
                                        <div className="staff-timeline-date">
                                            {request.status === "Processing" &&
                                                "In progress"}
                                        </div>
                                    </div>
                                </li>

                                <li
                                    className={`staff-timeline-item ${
                                        request.ready_for_pickup_at
                                            ? "done"
                                            : "pending"
                                    }`}
                                >
                                    <span className="staff-timeline-dot" />
                                    <div>
                                        <strong>Ready for Pickup</strong>
                                        <div className="staff-timeline-date">
                                            {formatDate(
                                                request.ready_for_pickup_at
                                            )}
                                        </div>
                                    </div>
                                </li>

                                <li
                                    className={`staff-timeline-item ${
                                        request.claimed_at ? "done" : "pending"
                                    }`}
                                >
                                    <span className="staff-timeline-dot" />
                                    <div>
                                        <strong>Completed</strong>
                                        <div className="staff-timeline-date">
                                            {formatDate(request.claimed_at)}
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Update Status */}
                        <div className="staff-work-card">
                            <div className="staff-detail-section-title">
                                Update Status
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label
                                    htmlFor="remarks"
                                    className="staff-detail-label"
                                    style={{ display: "block", marginBottom: 6 }}
                                >
                                    Remarks / Processing Notes
                                </label>
                                <textarea
                                    id="remarks"
                                    rows={3}
                                    className="staff-detail-textarea"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Optional notes before changing status…"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="staff-action-buttons">
                                {request.status === "Pending" && (
                                    <>
                                        <button
                                            type="button"
                                            className="staff-btn staff-btn-success"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate("Approved")
                                            }
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            type="button"
                                            className="staff-btn staff-btn-danger"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate("Rejected")
                                            }
                                        >
                                            ✕ Reject
                                        </button>
                                    </>
                                )}

                                {request.status === "Approved" && (
                                    <button
                                        type="button"
                                        className="staff-btn staff-btn-primary"
                                        disabled={submitting}
                                        onClick={() =>
                                            handleStatusUpdate("Processing")
                                        }
                                    >
                                        ▶ Start Processing
                                    </button>
                                )}

                                {request.status === "Processing" && (
                                    <button
                                        type="button"
                                        className="staff-btn staff-btn-info"
                                        disabled={submitting}
                                        onClick={() =>
                                            handleStatusUpdate("Ready for Pickup")
                                        }
                                    >
                                        📦 Mark Ready for Pickup
                                    </button>
                                )}

                                {request.status === "Ready for Pickup" && (
                                    <button
                                        type="button"
                                        className="staff-btn staff-btn-success"
                                        disabled={submitting}
                                        onClick={() =>
                                            handleStatusUpdate("Completed")
                                        }
                                    >
                                        ✓ Mark Completed
                                    </button>
                                )}

                                {isFinal && (
                                    <p className="staff-final-note">
                                        This request is in a final status. No
                                        further transitions are allowed.
                                    </p>
                                )}
                            </div>

                            <div style={{ marginTop: 16, borderTop: "1px solid rgba(22,101,52,0.1)", paddingTop: 14 }}>
                                <button
                                    type="button"
                                    className="staff-btn staff-btn-outline-danger"
                                    disabled={submitting}
                                    onClick={handleDelete}
                                    style={{ width: "100%" }}
                                >
                                    🗑 Delete This Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PortalLayout>
>>>>>>> Stashed changes
    );
}

export default StaffRequestDetails;
