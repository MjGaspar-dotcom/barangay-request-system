import { useEffect, useState } from "react";
import { Button, CircularProgress, TextField } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/ui/StatusBadge";
import api from "../../services/api";
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

function StaffRequestDetails() {
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

            alert(`Status updated to ${newStatus}.`);
            fetchRequest();
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
            "Are you sure you want to delete this request?",
        );

        if (!confirmDelete) return;

        try {
            await api.delete(endpoint);

            alert("Request deleted successfully.");
            navigate("/staff/dashboard");
        } catch (err) {
            console.error("Failed to delete request:", err);

            const msg =
                err.response?.data?.message || "Failed to delete request.";

            alert(msg);
        }
    };

    if (loading) {
        return (
            <RequestPageState>
                <CircularProgress color="success" size={32} />

                <span>Loading request details...</span>
            </RequestPageState>
        );
    }

    if (error) {
        return (
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
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";

    return (
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
    );
}

export default StaffRequestDetails;
