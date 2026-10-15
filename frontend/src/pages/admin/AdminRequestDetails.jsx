import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
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

    const handleStatusUpdate = async (newStatus) => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmAction = window.confirm(
            `Change status to "${newStatus}"?`,
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
            "Are you sure you want to delete this request? This cannot be undone.",
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
                <RequestPageState>
                    <Alert severity="error">{error}</Alert>

                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => navigate("/admin/requests")}
                    >
                        ← Back to Manage Requests
                    </Button>
                </RequestPageState>
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

                                    <div>
                                        <strong>Approved</strong>

                                        <RequestTimelineDate>
                                            {formatDate(request.approved_at)}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>

                                <RequestTimelineItem
                                    completed={processingCompleted}
                                >
                                    <RequestTimelineDot
                                        completed={processingCompleted}
                                    />

                                    <div>
                                        <strong>Processing</strong>

                                        <RequestTimelineDate>
                                            {request.status === "Processing"
                                                ? "In progress"
                                                : ""}
                                        </RequestTimelineDate>
                                    </div>
                                </RequestTimelineItem>

                                <RequestTimelineItem
                                    completed={Boolean(
                                        request.ready_for_pickup_at,
                                    )}
                                >
                                    <RequestTimelineDot
                                        completed={Boolean(
                                            request.ready_for_pickup_at,
                                        )}
                                    />

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
        </AdminLayout>
    );
}
