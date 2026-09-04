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
        const id = request.request_id || request.guest_request_id;
        return request.request_type === "guest"
            ? `/guest-requests/${id}`
            : `/barangay-requests/${id}`;
    };

    // Helper: get requester display name
    const getRequesterName = (request) => {
        if (request.request_type === "registered" && request.user) {
            return `${request.user.first_name} ${request.user.last_name}`;
        }
        if (request.request_type === "guest") {
            const g = request.guest || request;
            if (g.first_name) {
                return `${g.first_name} ${g.last_name}`;
            }
        }
        return "Unknown";
    };

    const handleStatusUpdate = async (request, newStatus) => {
        const confirmAction = window.confirm(
            `Are you sure you want to change status to "${newStatus}"?`
        );
        if (!confirmAction) return;

        try {
            await api.put(getEndpoint(request), { status: newStatus });
            alert(`Request status updated to ${newStatus}.`);
            fetchRequests();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            alert(msg);
        }
    };

    const handleDelete = async (request) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete tracking number ${request.tracking_number}?`
        );
        if (!confirmDelete) return;

        try {
            await api.delete(getEndpoint(request));
            alert("Request deleted successfully.");
            fetchRequests();
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            alert(msg);
        }
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
                        {requests.map((request) => {
                            const reqId = request.request_id || request.guest_request_id;
                            const reqType = request.request_type || "registered";

                            return (
                                <tr key={`${reqType}-${reqId}`}>
                                    <td>{request.tracking_number}</td>

                                    <td>
                                        {reqType === "registered"
                                            ? "Registered"
                                            : "Guest"}
                                    </td>

                                    <td>{getRequesterName(request)}</td>

                                    <td>
                                        {request.document_type?.document_name ||
                                            request.document_name ||
                                            "Unknown"}
                                    </td>

                                    <td>{request.status}</td>

                                    <td>{request.purpose}</td>

                                    <td>
                                        {new Date(
                                            request.created_at
                                        ).toLocaleString()}
                                    </td>

                                    <td>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/staff/requests/${reqType}/${reqId}`
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        {request.status === "Pending" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request,
                                                            "Approved"
                                                        )
                                                    }
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request,
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
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Processing"
                                                    )
                                                }
                                            >
                                                Start Processing
                                            </button>
                                        )}

                                        {request.status === "Processing" && (
                                            <button
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Ready for Pickup"
                                                    )
                                                }
                                            >
                                                Ready for Pickup
                                            </button>
                                        )}

                                        {request.status === "Ready for Pickup" && (
                                            <button
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Completed"
                                                    )
                                                }
                                            >
                                                Mark Completed
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(request)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default StaffDashboard;
