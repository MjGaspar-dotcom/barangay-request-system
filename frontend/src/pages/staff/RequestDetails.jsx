import { useEffect, useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { Button, CircularProgress, TextField } from "@mui/material";
=======
import Button from "../../components/ui/Button";
>>>>>>> Stashed changes
=======
import Button from "../../components/ui/Button";
>>>>>>> Stashed changes
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/ui/StatusBadge";
import api from "../../services/api";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import {
    RequestActions,
    RequestBackRow,
    RequestDetailItem,
    RequestDetailLabel,
    RequestDetailLink,
    RequestDetailsCard,
    RequestDetailsGrid,
    RequestDetailsHeader,
    RequestDetailsPage,
    RequestDetailsSection,
    RequestDetailsSectionTitle,
    RequestDetailValue,
    RequestErrorMessage,
    RequestPageState,
} from "../../styles/requestDetails.styles";
=======
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
>>>>>>> Stashed changes
=======
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
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
    const [confirmation, setConfirmation] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

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
                // Fallback attempt if type was omitted in route
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
    }, [type, requestId]);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const handleStatusUpdate = async (newStatus) => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmAction = window.confirm(
            `Change status to "${newStatus}"?`,
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
>>>>>>> Stashed changes

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

>>>>>>> Stashed changes
    const performStatusUpdate = async (newStatus) => {
        const endpoint = requestType === "guest" ? `/guest-requests/${requestId}` : `/barangay-requests/${requestId}`;
        setActionMessage("");
        setSubmitting(true);

        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            alert(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);

            const msg =
                err.response?.data?.message || "Failed to update status.";

            alert(msg);
=======
            setActionMessage(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            setActionMessage(msg);
>>>>>>> Stashed changes
=======
            setActionMessage(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            setActionMessage(msg);
>>>>>>> Stashed changes
        } finally {
            setSubmitting(false);
        }
    };

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const handleDelete = async () => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this request?",
        );

        if (!confirmDelete) return;
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
>>>>>>> Stashed changes

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

>>>>>>> Stashed changes
    const performDelete = async () => {
        const endpoint = requestType === "guest" ? `/guest-requests/${requestId}` : `/barangay-requests/${requestId}`;
        setActionMessage("");
        try {
            await api.delete(endpoint);
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            alert("Request deleted successfully.");
            navigate("/staff/dashboard");
        } catch (err) {
            console.error("Failed to delete request:", err);

            const msg =
                err.response?.data?.message || "Failed to delete request.";

            alert(msg);
=======
            navigate("/staff/queue");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> Stashed changes
=======
            navigate("/staff/queue");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> Stashed changes
        }
    };

    if (loading) {
        return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            <RequestPageState>
                <CircularProgress color="success" size={32} />

                <span>Loading request details...</span>
            </RequestPageState>
=======
            <StaffLayout>
                <div className="page-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div><p>Loading request details...</p></div>
            </StaffLayout>
>>>>>>> Stashed changes
=======
            <StaffLayout>
                <div className="page-loading"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div><p>Loading request details...</p></div>
            </StaffLayout>
>>>>>>> Stashed changes
        );
    }

    if (error) {
        return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            <RequestPageState>
                <RequestErrorMessage>{error}</RequestErrorMessage>

                <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate("/staff/dashboard")}
                >
                    Back to Dashboard
                </Button>
            </RequestPageState>
=======
=======
>>>>>>> Stashed changes
            <StaffLayout>
                <div className="alert alert-danger detail-error-state" role="alert">
                    <p>{error}</p>
                    <Button className="btn btn-outline-secondary" onClick={() => navigate("/staff/queue")}>
                        Back to Request Queue
                    </Button>
                </div>
            </StaffLayout>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        <RequestDetailsPage>
            <RequestDetailsCard>
                <RequestDetailsHeader>
                    <div>
                        <h1>Request Details</h1>
                    </div>

                    <StatusBadge status={request.status} />
                </RequestDetailsHeader>

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Request Information
                    </RequestDetailsSectionTitle>

                    <RequestDetailsGrid>
                        <RequestDetailItem>
                            <RequestDetailLabel>
                                Tracking Number
                            </RequestDetailLabel>

                            <RequestDetailValue>
                                {request.tracking_number}
                            </RequestDetailValue>
                        </RequestDetailItem>

                        <RequestDetailItem>
                            <RequestDetailLabel>
                                Request Type
                            </RequestDetailLabel>

                            <RequestDetailValue>
                                {isGuest
                                    ? "Guest Request"
                                    : "Registered Resident Request"}
                            </RequestDetailValue>
                        </RequestDetailItem>

                        <RequestDetailItem>
                            <RequestDetailLabel>Document</RequestDetailLabel>

                            <RequestDetailValue>
                                {request.document_type?.document_name ||
                                    "Unknown"}
                            </RequestDetailValue>
                        </RequestDetailItem>

                        <RequestDetailItem>
                            <RequestDetailLabel>Purpose</RequestDetailLabel>

                            <RequestDetailValue>
                                {request.purpose}
                            </RequestDetailValue>
                        </RequestDetailItem>
                    </RequestDetailsGrid>
                </RequestDetailsSection>

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Requester Details
                    </RequestDetailsSectionTitle>

                    {!isGuest && request.user && (
                        <RequestDetailsGrid>
                            <RequestDetailItem>
                                <RequestDetailLabel>Name</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.user.first_name}{" "}
                                    {request.user.last_name}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>Email</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.user.email}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>Contact</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.user.contact_number || "N/A"}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        </RequestDetailsGrid>
                    )}

                    {isGuest && (
                        <RequestDetailsGrid>
                            <RequestDetailItem>
                                <RequestDetailLabel>Name</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.first_name}{" "}
                                    {request.middle_name
                                        ? `${request.middle_name} `
                                        : ""}
                                    {request.last_name}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Birth Date
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.birth_date}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>Gender</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.gender}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Civil Status
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.civil_status}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>Purok</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.address}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Contact Number
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.contact_number}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>Email</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.email || "N/A"}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Valid ID Type
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.valid_id_type}
                                </RequestDetailValue>
                            </RequestDetailItem>

                            {request.valid_id_image && (
                                <RequestDetailItem>
                                    <RequestDetailLabel>
                                        Valid ID Image
                                    </RequestDetailLabel>

                                    <RequestDetailLink
                                        href={`http://127.0.0.1:8000/storage/${request.valid_id_image}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View Submitted ID
                                    </RequestDetailLink>
                                </RequestDetailItem>
                            )}
                        </RequestDetailsGrid>
                    )}
                </RequestDetailsSection>

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Timestamps & Remarks
                    </RequestDetailsSectionTitle>

                    <RequestDetailsGrid>
                        <RequestDetailItem>
                            <RequestDetailLabel>Submitted</RequestDetailLabel>

                            <RequestDetailValue>
                                {new Date(request.created_at).toLocaleString()}
                            </RequestDetailValue>
                        </RequestDetailItem>

                        {request.approved_at && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Approved At
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {new Date(
                                        request.approved_at,
                                    ).toLocaleString()}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}

                        {request.ready_for_pickup_at && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Ready for Pickup At
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {new Date(
                                        request.ready_for_pickup_at,
                                    ).toLocaleString()}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}

                        {request.claimed_at && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Claimed / Completed At
                                </RequestDetailLabel>

                                <RequestDetailValue>
                                    {new Date(
                                        request.claimed_at,
                                    ).toLocaleString()}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                    </RequestDetailsGrid>
                </RequestDetailsSection>

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Processing Notes
                    </RequestDetailsSectionTitle>

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Remarks / Processing Notes"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter optional remarks before changing status"
                    />
                </RequestDetailsSection>

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Actions
                    </RequestDetailsSectionTitle>

                    <RequestActions>
                        {request.status === "Pending" && (
                            <>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="success"
                                    disabled={submitting}
                                    onClick={() =>
                                        handleStatusUpdate("Approved")
                                    }
                                >
                                    Approve
                                </Button>

                                <Button
                                    type="button"
                                    variant="contained"
                                    color="error"
                                    disabled={submitting}
                                    onClick={() =>
                                        handleStatusUpdate("Rejected")
                                    }
                                >
                                    Reject
                                </Button>
                            </>
                        )}

                        {request.status === "Approved" && (
                            <Button
                                type="button"
                                variant="contained"
                                disabled={submitting}
                                onClick={() => handleStatusUpdate("Processing")}
                            >
                                Start Processing
                            </Button>
                        )}

                        {request.status === "Processing" && (
                            <Button
                                type="button"
                                variant="contained"
                                color="info"
                                disabled={submitting}
                                onClick={() =>
                                    handleStatusUpdate("Ready for Pickup")
                                }
                            >
                                Ready for Pickup
                            </Button>
                        )}

                        {request.status === "Ready for Pickup" && (
                            <Button
                                type="button"
                                variant="contained"
                                color="success"
                                disabled={submitting}
                                onClick={() => handleStatusUpdate("Completed")}
                            >
                                Mark Completed
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outlined"
                            color="error"
                            disabled={submitting}
                            onClick={handleDelete}
                        >
                            Delete Request
                        </Button>
                    </RequestActions>
                </RequestDetailsSection>

                <RequestBackRow>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={() => navigate("/staff/dashboard")}
                    >
                        Back to Dashboard
                    </Button>
                </RequestBackRow>
            </RequestDetailsCard>
        </RequestDetailsPage>
=======
        <StaffLayout>
            <main className="staff-request-details-page admin-dashboard">
                <div className="staff-request-details-content">
                    {actionMessage && (
                        <div className="alert alert-info" role="status">
                            {actionMessage}
                        </div>
                    )}
=======
        <StaffLayout>
            <main className="staff-request-details-page admin-dashboard">
                <div className="staff-request-details-content">
                    {actionMessage && (
                        <div className="alert alert-info" role="status">
                            {actionMessage}
                        </div>
                    )}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    );
}

export default StaffRequestDetails;
