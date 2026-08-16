import { useEffect, useState } from "react";
import api from "../../services/api";

function StaffDashboard() {
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default StaffDashboard;