import UserRequestForm from "../../components/forms/UserRequestForm";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

function UserDashboard() {
    const { logout } = useAuth();

    const [documentTypes, setDocumentTypes] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [documentTypesResponse, requestsResponse] =
                    await Promise.all([
                        api.get("/document-types"),
                        api.get("/barangay-requests"),
                    ]);

                setDocumentTypes(documentTypesResponse.data.data);
                setRequests(requestsResponse.data.data);
            } catch (error) {
                console.error(error);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>User Dashboard</h1>

            <button onClick={logout}>
                Logout
            </button>

            <h2>Available Document Types</h2>

            {documentTypes.length === 0 ? (
                <p>No document types available.</p>
            ) : (
                <ul>
                    {documentTypes.map((documentType) => (
                        <li key={documentType.document_type_id}>
                            {documentType.document_name}
                        </li>
                    ))}
                </ul>
            )}

<h2>Request a Document</h2>

<UserRequestForm />

<h2>My Barangay Requests</h2>

            {requests.length === 0 ? (
                <p>You have no barangay requests yet.</p>
            ) : (
                <ul>
                    {requests.map((request) => (
                        <li key={request.barangay_request_id}>
                            <strong>{request.tracking_number}</strong>
                            <br />
                            Status: {request.status}
                            <br />
                            Purpose: {request.purpose}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default UserDashboard;