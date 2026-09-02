
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function StaffRequestDetails() {
    const { requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.get(
                    `/barangay-requests/${requestId}`
                );

                setRequest(response.data.data);
            } catch (error) {
                console.error(error);

                if (error.response?.status === 403) {
                    setError(
                        "You are not authorized to view this request."
                    );
                } else if (error.response?.status === 404) {
                    setError("Request not found.");
                } else {
                    setError(
                        "Failed to load request details."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

    if (loading) {
        return <div>Loading request details...</div>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>

                <button
                    onClick={() =>
                        navigate("/staff/dashboard")
                    }
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1>Request Details</h1>

            <p>
                <strong>Tracking Number:</strong>{" "}
                {request.tracking_number}
            </p>

            <p>
                <strong>Document:</strong>{" "}
                {request.document_type?.document_name ||
                    "Unknown"}
            </p>

            <p>
                <strong>Status:</strong>{" "}
                {request.status}
            </p>

            <p>
                <strong>Purpose:</strong>{" "}
                {request.purpose}
            </p>

            <p>
                <strong>Submitted:</strong>{" "}
                {new Date(
                    request.created_at
                ).toLocaleString()}
            </p>

            {request.remarks && (
                <p>
                    <strong>Remarks:</strong>{" "}
                    {request.remarks}
                </p>
            )}

            <button
                onClick={() =>
                    navigate("/staff/dashboard")
                }
            >
                Back to Dashboard
            </button>
        </div>
    );
}

export default StaffRequestDetails;
