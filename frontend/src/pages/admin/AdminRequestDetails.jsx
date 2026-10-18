import { useEffect, useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
=======
import Button from "../../components/ui/Button";
>>>>>>> Stashed changes
=======
import Button from "../../components/ui/Button";
>>>>>>> Stashed changes
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import {
    RequestDetailItem,
    RequestDetailLabel,
    RequestDetailsGrid,
    RequestDetailValue,
    RequestPageState,
} from "../../styles/requestDetails.styles";
import {
    AdminRequestColumn,
    AdminRequestColumns,
    AdminRequestDetailsRoot,
    AdminRequestFullWidthItem,
    AdminRequestHeader,
    AdminRequestIdLink,
    AdminRequestLabel,
    AdminRequestPanel,
    AdminRequestPanelTitle,
    BackButtonRow,
    DeleteRequestButton,
    FinalStatusMessage,
    RequestTimeline,
    RequestTimelineDate,
    RequestTimelineDot,
    RequestTimelineItem,
    StatusActionField,
    StatusActions,
} from "./AdminRequestDetails.styles";
=======
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> Stashed changes
=======
import ConfirmDialog from "../../components/ui/ConfirmDialog";
>>>>>>> Stashed changes

export default function AdminRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submittingStatus, setSubmittingStatus] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

    const fetchRequest = async ({ showLoading = true } = {}) => {
        if (showLoading) {
            setLoading(true);
            setError("");
        }

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
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            if (err.response?.status === 403) {
                setError("You are not authorized to view this request.");
            } else if (err.response?.status === 404) {
                setError("Request not found.");
=======
=======
>>>>>>> Stashed changes
            if (!showLoading) {
                setActionMessage(
                    "Status was updated, but the latest request details could not be refreshed."
                );
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
        }
    };

    useEffect(() => {
        fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream

=======
        setSubmittingStatus(newStatus);
>>>>>>> Stashed changes
=======
        setSubmittingStatus(newStatus);
>>>>>>> Stashed changes
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            await fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);

            const msg =
                err.response?.data?.message || "Failed to update status.";

            alert(msg);
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
>>>>>>> Stashed changes
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
>>>>>>> Stashed changes
        } finally {
            setSubmitting(false);
            setSubmittingStatus("");
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
            "Are you sure you want to delete this request? This cannot be undone.",
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
            navigate("/admin/requests");
        } catch (err) {
            console.error("Failed to delete request:", err);
<<<<<<< Updated upstream
<<<<<<< Updated upstream

            const msg =
                err.response?.data?.message || "Failed to delete request.";

            alert(msg);
=======
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> Stashed changes
=======
            const msg = err.response?.data?.message || "Failed to delete request.";
            setActionMessage(msg);
>>>>>>> Stashed changes
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <RequestPageState>
                    <CircularProgress color="success" size={32} />

                    <p>Loading request details...</p>
                </RequestPageState>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
<<<<<<< Updated upstream
                <RequestPageState>
                    <Alert severity="error">{error}</Alert>

=======
                <div className="page-loading">
                    <h3 className="text-danger-token">{error}</h3>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => navigate("/admin/requests")}
                    >
                        ← Back to Manage Requests
                    </Button>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                </RequestPageState>
=======
=======
>>>>>>> Stashed changes
                </div>
>>>>>>> Stashed changes
            </AdminLayout>
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";

    const idImage = isGuest ? request.valid_id_image : null;

    const getValidIdImageUrl = (path) => {
        if (!path) return null;

        if (path.startsWith("http")) {
            return path;
        }

        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const processingCompleted =
        request.status === "Processing" ||
        request.status === "Ready for Pickup" ||
        request.status === "Completed" ||
        Boolean(request.ready_for_pickup_at);

    return (
        <AdminLayout>
            <AdminRequestDetailsRoot>
                <AdminRequestHeader>
                    <div>
                        <AdminRequestLabel>REQUEST DETAILS</AdminRequestLabel>

                        <h1>{request.tracking_number}</h1>

                        <p>
                            {isGuest
                                ? "Guest document request"
                                : "Registered resident document request"}
                        </p>
                    </div>

                    <StatusBadge status={request.status} />
                </AdminRequestHeader>

                <AdminRequestColumns>
                    <AdminRequestColumn>
                        <AdminRequestPanel>
                            <AdminRequestPanelTitle>
                                Request Information
                            </AdminRequestPanelTitle>

                            <RequestDetailsGrid>
                                <RequestDetailItem>
                                    <RequestDetailLabel>
                                        Document Type
                                    </RequestDetailLabel>

                                    <RequestDetailValue>
                                        {request.document_type?.document_name ||
                                            "Unknown"}
                                    </RequestDetailValue>
                                </RequestDetailItem>

                                <RequestDetailItem>
                                    <RequestDetailLabel>
                                        Purpose
                                    </RequestDetailLabel>

                                    <RequestDetailValue>
                                        {request.purpose || "—"}
                                    </RequestDetailValue>
                                </RequestDetailItem>

                                <RequestDetailItem>
                                    <RequestDetailLabel>
                                        Submitted At
                                    </RequestDetailLabel>

                                    <RequestDetailValue>
                                        {formatDate(request.created_at)}
                                    </RequestDetailValue>
                                </RequestDetailItem>

                                <RequestDetailItem>
                                    <RequestDetailLabel>
                                        Last Updated
                                    </RequestDetailLabel>

                                    <RequestDetailValue>
                                        {formatDate(request.updated_at)}
                                    </RequestDetailValue>
                                </RequestDetailItem>
                            </RequestDetailsGrid>
                        </AdminRequestPanel>

                        <AdminRequestPanel>
                            <AdminRequestPanelTitle>
                                Requester Details
                            </AdminRequestPanelTitle>

                            {!isGuest && request.user && (
                                <RequestDetailsGrid>
                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Name
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.user.first_name}{" "}
                                            {request.user.last_name}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Username
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.user.username}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Email
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.user.email}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Contact
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.user.contact_number || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <AdminRequestFullWidthItem>
                                        <RequestDetailLabel>
                                            Purok
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.user.address || "—"}
                                        </RequestDetailValue>
                                    </AdminRequestFullWidthItem>
                                </RequestDetailsGrid>
                            )}

                            {isGuest && (
                                <RequestDetailsGrid>
                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Name
                                        </RequestDetailLabel>

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
                                            {formatDate(request.birth_date)}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Gender
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.gender || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Civil Status
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.civil_status || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Contact
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.contact_number || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Email
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.email || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <AdminRequestFullWidthItem>
                                        <RequestDetailLabel>
                                            Purok
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.address || "—"}
                                        </RequestDetailValue>
                                    </AdminRequestFullWidthItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Valid ID Type
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {request.valid_id_type || "—"}
                                        </RequestDetailValue>
                                    </RequestDetailItem>

                                    <RequestDetailItem>
                                        <RequestDetailLabel>
                                            Valid ID Image
                                        </RequestDetailLabel>

                                        <RequestDetailValue>
                                            {idImage ? (
                                                <AdminRequestIdLink
                                                    href={getValidIdImageUrl(
                                                        idImage,
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View uploaded ID
                                                </AdminRequestIdLink>
                                            ) : (
                                                "—"
                                            )}
                                        </RequestDetailValue>
                                    </RequestDetailItem>
                                </RequestDetailsGrid>
                            )}
                        </AdminRequestPanel>
                    </AdminRequestColumn>

                    <AdminRequestColumn>
                        <AdminRequestPanel>
                            <AdminRequestPanelTitle>
                                Processing Timeline
                            </AdminRequestPanelTitle>

                            <RequestTimeline>
                                <RequestTimelineItem completed>
                                    <RequestTimelineDot completed />

                                    <div>
                                        <strong>Submitted</strong>

                                        <RequestTimelineDate>
                                            {formatDate(request.created_at)}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>

                                <RequestTimelineItem
                                    completed={Boolean(request.approved_at)}
                                >
                                    <RequestTimelineDot
                                        completed={Boolean(request.approved_at)}
                                    />
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
>>>>>>> Stashed changes
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
                                        Request Information
                                    </h3>
>>>>>>> Stashed changes

                                    <div>
                                        <strong>Approved</strong>

                                        <RequestTimelineDate>
                                            {formatDate(request.approved_at)}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                                <RequestTimelineItem
                                    completed={processingCompleted}
                                >
                                    <RequestTimelineDot
                                        completed={processingCompleted}
                                    />
=======
=======
>>>>>>> Stashed changes
                                <div
                                    className={`admin-form-card${
                                        !isGuest && !request.user
                                            ? " requester-details-empty-card"
                                            : ""
                                    }`}
                                >
                                    <h3 className="form-section-title">
                                        Requester Details
                                    </h3>
>>>>>>> Stashed changes

                                    <div>
                                        <strong>Processing</strong>

<<<<<<< Updated upstream
                                        <RequestTimelineDate>
                                            {request.status === "Processing"
                                                ? "In progress"
                                                : ""}
                                        </RequestTimelineDate>
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
                                                            className="detail-link"
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
                                    <h3 className="form-section-title">
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
                                    <h3 className="form-section-title">
                                        Update Status
                                    </h3>

                                    <div className="detail-form-field">
                                        <label className="form-label fw-semibold">
                                            Remarks
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={remarks}
                                            disabled={submitting}
                                            onChange={(event) =>
                                                setRemarks(event.target.value)
                                            }
                                            placeholder="Optional notes about this status change..."
                                        />
>>>>>>> Stashed changes
                                    </div>
                                </RequestTimelineItem>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                                <RequestTimelineItem
                                    completed={Boolean(
                                        request.ready_for_pickup_at,
                                    )}
                                >
                                    <RequestTimelineDot
                                        completed={Boolean(
                                            request.ready_for_pickup_at,
=======
=======
>>>>>>> Stashed changes
                                    <div className="detail-action-footer">
                                        {request.status === "Pending" && (
                                            <>
                                                <Button
                                                    type="button"
                                                    className="btn btn-success"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Approved"
                                                        )
                                                    }
                                                >
                                                    {statusButtonContent(
                                                        "Approve",
                                                        "Approved"
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    disabled={submitting}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            "Rejected"
                                                        )
                                                    }
                                                >
                                                    {statusButtonContent(
                                                        "Reject",
                                                        "Rejected"
                                                    )}
                                                </Button>
                                            </>
>>>>>>> Stashed changes
                                        )}
                                    />

<<<<<<< Updated upstream
                                    <div>
                                        <strong>Ready for Pickup</strong>

                                        <RequestTimelineDate>
                                            {formatDate(
                                                request.ready_for_pickup_at,
                                            )}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>

                                <RequestTimelineItem
                                    completed={Boolean(request.claimed_at)}
                                >
                                    <RequestTimelineDot
                                        completed={Boolean(request.claimed_at)}
                                    />

                                    <div>
                                        <strong>Completed</strong>

                                        <RequestTimelineDate>
                                            {formatDate(request.claimed_at)}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>
                            </RequestTimeline>
                        </AdminRequestPanel>

                        <AdminRequestPanel>
                            <AdminRequestPanelTitle>
                                Update Status
                            </AdminRequestPanelTitle>

                            <StatusActionField>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    label="Remarks"
                                    value={remarks}
                                    onChange={(event) =>
                                        setRemarks(event.target.value)
                                    }
                                    placeholder="Optional notes about this status change..."
                                />
                            </StatusActionField>

                            <StatusActions>
                                {request.status === "Pending" && (
                                    <>
=======
                                        {request.status === "Approved" && (
                                            <Button
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Processing"
                                                    )
                                                }
                                            >
                                                {statusButtonContent(
                                                    "Start Processing",
                                                    "Processing"
                                                )}
                                            </Button>
                                        )}

                                        {request.status === "Processing" && (
                                            <Button
                                                type="button"
                                                className="btn btn-info"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Ready for Pickup"
                                                    )
                                                }
                                            >
                                                {statusButtonContent(
                                                    "Mark Ready for Pickup",
                                                    "Ready for Pickup"
                                                )}
                                            </Button>
                                        )}

                                        {request.status ===
                                            "Ready for Pickup" && (
                                            <Button
                                                type="button"
                                                className="btn btn-success"
                                                disabled={submitting}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        "Completed"
                                                    )
                                                }
                                            >
                                                {statusButtonContent(
                                                    "Mark Completed",
                                                    "Completed"
                                                )}
                                            </Button>
                                        )}

                                        {(request.status === "Rejected" ||
                                            request.status === "Completed") && (
                                            <p className="final-status-note">
                                                This request is in a final
                                                status. No further transitions
                                                are allowed.
                                            </p>
                                        )}

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                                        <Button
                                            type="button"
                                            variant="contained"
                                            color="success"
                                            disabled={submitting}
                                            onClick={() =>
                                                handleStatusUpdate("Approved")
                                            }
                                        >
<<<<<<< Updated upstream
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
                                        onClick={() =>
                                            handleStatusUpdate("Processing")
                                        }
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
                                            handleStatusUpdate(
                                                "Ready for Pickup",
                                            )
                                        }
                                    >
                                        Mark Ready for Pickup
                                    </Button>
                                )}

                                {request.status === "Ready for Pickup" && (
                                    <Button
                                        type="button"
                                        variant="contained"
                                        color="success"
                                        disabled={submitting}
                                        onClick={() =>
                                            handleStatusUpdate("Completed")
                                        }
                                    >
                                        Mark Completed
                                    </Button>
                                )}

                                {(request.status === "Rejected" ||
                                    request.status === "Completed") && (
                                    <FinalStatusMessage>
                                        This request is in a final status. No
                                        further transitions are allowed.
                                    </FinalStatusMessage>
                                )}

                                <DeleteRequestButton
                                    type="button"
                                    variant="outlined"
                                    color="error"
                                    disabled={submitting}
                                    onClick={handleDelete}
                                >
                                    Delete Request
                                </DeleteRequestButton>
                            </StatusActions>
                        </AdminRequestPanel>

                        <BackButtonRow>
                            <Button
                                type="button"
                                variant="outlined"
                                color="secondary"
                                onClick={() => navigate("/admin/requests")}
                            >
                                ← Back to Manage Requests
                            </Button>
                        </BackButtonRow>
                    </AdminRequestColumn>
                </AdminRequestColumns>
            </AdminRequestDetailsRoot>
=======
                                            Delete Request
                                        </Button>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        </AdminLayout>
    );
}
