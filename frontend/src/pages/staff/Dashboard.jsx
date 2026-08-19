import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

function StaffDashboard() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await api.get("/barangay-requests");

                setRequests(response.data.data);
            } catch (error) {
                console.error(error);
                setError("Failed to load barangay requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    if (loading) {
        return <div>Loading requests...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Staff Dashboard</h1>

            <h2>Barangay Requests</h2>

            {requests.length === 0 ? (
                <p>No barangay requests found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Tracking Number</th>
                            <th>Document</th>
                            <th>Status</th>
                            <th>Purpose</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {requests.map((request) => (
                            <tr key={request.request_id}>
                                <td>
                                    {request.tracking_number}
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
                                                `/staff/requests/${request.request_id}`
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

                                            if (!confirmApprove) {
                                                return;
                                            }

                                            try {
                                                await api.put(
                                                    `/barangay-requests/${request.request_id}`,
                                                    {
                                                        status: "Approved",
                                                    }
                                                );

                                                alert("Request approved successfully.");

                                                const response = await api.get(
                                                    "/barangay-requests"
                                                );

                                                setRequests(response.data.data);

                                            } catch (error) {
                                                console.error(
                                                    "Failed to approve request:",
                                                    error
                                                );

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

                                            if (!confirmReject) {
                                                return;
                                            }

                                            try {
                                                await api.put(
                                                    `/barangay-requests/${request.request_id}`,
                                                    {
                                                        status: "Rejected",
                                                    }
                                                );

                                                alert("Request rejected successfully.");

                                                const response = await api.get(
                                                    "/barangay-requests"
                                                );

                                                setRequests(response.data.data);

                                            } catch (error) {
                                                console.error(
                                                    "Failed to reject request:",
                                                    error
                                                );

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