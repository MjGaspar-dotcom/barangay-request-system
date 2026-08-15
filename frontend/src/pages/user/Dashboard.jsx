import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

function UserDashboard() {
    const { logout } = useAuth();

    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                const response = await api.get("/document-types");
                setDocumentTypes(response.data.data);
            } catch (error) {
                console.error(error);
                setError("Failed to load document types.");
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentTypes();
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
        </div>
    );
}

export default UserDashboard;