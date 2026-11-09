import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

import { validateForm } from "../../utils/validateForm";
export default function UserRequestForm({ initialDocument = "" }) {
    const { user } = useAuth();
    const verificationStatus = user?.verification_status;

    const [documentTypes, setDocumentTypes] = useState([]);
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [purpose, setPurpose] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                const response = await api.get("/document-types");

                const availableDocumentTypes = response.data.data;
                setDocumentTypes(availableDocumentTypes);
                const recommendedDocument = availableDocumentTypes.find(
                    (documentType) =>
                        documentType.document_name === initialDocument
                );
                if (recommendedDocument) {
                    setDocumentTypeId(
                        String(recommendedDocument.document_type_id)
                    );
                }
            } catch (error) {
                console.error(error);
                setError("Failed to load document types.");
            } finally {
                setLoadingDocumentTypes(false);
            }
        };

        fetchDocumentTypes();
    }, [initialDocument]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm(event.currentTarget)) return;

        setError("");
        setSuccess("");

        if (verificationStatus !== "verified") {
            setError(
                "Your account must be verified before you can submit a request."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/barangay-requests", {
                document_type_id: documentTypeId,
                purpose: purpose,
            });

            setSuccess(
                `Request submitted successfully. Tracking number: ${response.data.data.request.tracking_number}`
            );

            setDocumentTypeId("");
            setPurpose("");
        } catch (error) {
            console.error(error);

            if (error.response?.status === 422) {
                setError("Please check the information you entered.");
            } else {
                setError(
                    error.response?.data?.message ||
                        "Failed to submit request."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingDocumentTypes) {
        return <p>Loading document types...</p>;
    }

    return (
        <form noValidate onSubmit={handleSubmit}>
            <div className="mb-3">
                <label
                    htmlFor="document_type_id"
                    className="form-label"
                >
                    Document Type
                </label>

                <select
                    id="document_type_id"
                    name="document_type_id"
                    className="form-select"
                    value={documentTypeId}
                    onChange={(event) =>
                        setDocumentTypeId(event.target.value)
                    }
                    required
                >
                    <option value="">
                        Select a document
                    </option>

                    {documentTypes.map((documentType) => (
                        <option
                            key={documentType.document_type_id}
                            value={documentType.document_type_id}
                        >
                            {documentType.document_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label
                    htmlFor="purpose"
                    className="form-label"
                >
                    Purpose
                </label>

                <textarea
                    id="purpose"
                    name="purpose"
                    className="form-control"
                    value={purpose}
                    onChange={(event) =>
                        setPurpose(event.target.value)
                    }
                    required
                />
            </div>

            {verificationStatus !== "verified" && (
                <div className="alert alert-info" role="status">
                    Your account must be verified before you can submit a
                    document request.
                </div>
            )}

            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}

            {success && (
                <p className="text-success">
                    {success}
                </p>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || verificationStatus !== "verified"}
            >
                {loading ? "Submitting..." : "Submit Request"}
            </button>
        </form>
    );
}
