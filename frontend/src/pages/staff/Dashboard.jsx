
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

function StaffDashboard() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/staff/requests");
            setRequests(response.data.data);
        } catch (error) {
            console.error(error);
            setError("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Helper: get the correct API path for a request
    const getEndpoint = (request) => {
        return request.request_type === "guest"
            ? `/guest-requests/${request.request_id}`
            : `/barangay-requests/${request.request_id}`;
    };

    // Helper: get requester display name
    const getRequesterName = (request) => {
        if (request.request_type === "registered" && request.user) {
            return `${request.user.first_name} ${request.user.last_name}`;
        }
        if (request.request_type === "guest" && request.guest) {
            return `${request.guest.first_name} ${request.guest.last_name}`;
        }
        return "Unknown";
    };

    if (loading) {
        return <div>Loading requests...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Staff Dashboard</h1>

            <h2>All Requests</h2>

            {requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Tracking Number</th>
                            <th>Type</th>
                            <th>Requester</th>
                            <th>Document</th>
                            <th>Status</th>
                            <th>Purpose</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {requests.map((request) => (
                            <tr key={`${request.request_type}-${request.request_id}`}>
                                <td>
                                    {request.tracking_number}
                                </td>

                                <td>
                                    {request.request_type === "registered"
                                        ? "Registered"
                                        : "Guest"}
                                </td>

                                <td>
                                    {getRequesterName(request)}
                                </td>

                                <td>
                                    {request.document_type?.document_name ||
                                        "Unknown"}
                                </td>

                                <td>
                                    {request.status}
                                </td>

                                <td>
                                    {request.purpose}
                                </td>

                                <td>
                                    {new Date(
                                        request.created_at
                                    ).toLocaleString()}
                                </td>

                                <td>
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/staff/requests/${request.request_type}/${request.request_id}`
                                            )
                                        }
                                    >
                                        View Details
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const confirmApprove = window.confirm(
                                                "Are you sure you want to approve this request?"
                                            );

                                            if (!confirmApprove) return;

                                            try {
                                                await api.put(
                                                    getEndpoint(request),
                                                    { status: "Approved" }
                                                );

                                                alert("Request approved successfully.");
                                                fetchRequests();
                                            } catch (error) {
                                                console.error("Failed to approve request:", error);
                                                alert("Failed to approve request.");
                                            }
                                        }}
                                    >
                                        Approve
                                    </button>

                                    <button
                                        onClick={async () => {
                                            const confirmReject = window.confirm(
                                                "Are you sure you want to reject this request?"
                                            );

                                            if (!confirmReject) return;

                                            try {
                                                await api.put(
                                                    getEndpoint(request),
                                                    { status: "Rejected" }
                                                );

                                                alert("Request rejected successfully.");
                                                fetchRequests();
                                            } catch (error) {
                                                console.error("Failed to reject request:", error);
                                                alert("Failed to reject request.");
                                            }
                                        }}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default StaffDashboard;
