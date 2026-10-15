import { useEffect, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/ui/StatusBadge";
import api from "../../services/api";
import {
    RequestBackRow,
    RequestDetailItem,
    RequestDetailLabel,
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

function RequestDetails() {
    const { requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.get(
                    `/barangay-requests/${requestId}`,
                );

                setRequest(response.data.data);
            } catch (error) {
                console.error(error);

                if (error.response?.status === 403) {
                    setError("You are not authorized to view this request.");
                } else if (error.response?.status === 404) {
                    setError("Request not found.");
                } else {
                    setError("Failed to load request details.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

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
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </Button>
            </RequestPageState>
        );
    }

    if (!request) return null;

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

                        <RequestDetailItem>
                            <RequestDetailLabel>Submitted</RequestDetailLabel>

                            <RequestDetailValue>
                                {new Date(request.created_at).toLocaleString()}
                            </RequestDetailValue>
                        </RequestDetailItem>

                        {request.remarks && (
                            <RequestDetailItem>
                                <RequestDetailLabel>Remarks</RequestDetailLabel>

                                <RequestDetailValue>
                                    {request.remarks}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                    </RequestDetailsGrid>
                </RequestDetailsSection>

                <RequestBackRow>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to Dashboard
                    </Button>
                </RequestBackRow>
            </RequestDetailsCard>
        </RequestDetailsPage>
    );
}

export default RequestDetails;
