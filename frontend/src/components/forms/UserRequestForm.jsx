import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

import { validateForm } from "../../utils/validateForm";
export default function UserRequestForm({ initialDocument = "" }) {
    const { user } = useAuth();
    const verificationStatus = user?.verification_status;

    const [documentTypes, setDocumentTypes] = useState([]);
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [purpose, setPurpose] = useState("");
    const [numberOfChildren, setNumberOfChildren] = useState("");
    const [supportingDocuments, setSupportingDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
    const [error, setError] = useState("");
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const supportingDocumentsInput = useRef(null);
    const selectedDocumentType = documentTypes.find(
        (documentType) =>
            String(documentType.document_type_id) === documentTypeId,
    );
    const requiresChildrenCount =
        selectedDocumentType?.document_name === "Certificate of Solo Parent";

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
        setSubmittedRequest(null);

        if (supportingDocuments.length > 5) {
            setError("You can attach up to five supporting documents.");
            return;
        }

        if (user?.verification_status !== "verified") {
            setError(
                user?.verification_status === "rejected"
                    ? "Your account verification was rejected. Update your profile and valid ID information, then request another review."
                    : "Your account must be verified before you can submit a document request."
            );
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("document_type_id", documentTypeId);
            formData.append("purpose", purpose);
            if (requiresChildrenCount) {
                formData.append(
                    "request_data[number_of_children]",
                    numberOfChildren,
                );
            }
            supportingDocuments.forEach((file) => {
                formData.append("supporting_documents[]", file);
            });

            const response = await api.post("/barangay-requests", formData);

            const requestData = response.data?.data;
            const trackingNumber = requestData?.request?.tracking_number;
            if (!trackingNumber) {
                throw new Error(
                    "Request submission response did not include a tracking number."
                );
            }

            setSubmittedRequest({
                trackingNumber,
                qrCode: requestData.qr_code || "",
            });

            setDocumentTypeId("");
            setPurpose("");
            setNumberOfChildren("");
            setSupportingDocuments([]);
            if (supportingDocumentsInput.current) {
                supportingDocumentsInput.current.value = "";
            }
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
            <div className="mb-4">
                <label
                    htmlFor="document_type_id"
                    className="app-label"
                >
                    Document Type
                </label>

                <select
                    id="document_type_id"
                    name="document_type_id"
                    className="app-select"
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

            <div className="mb-4">
                <label
                    htmlFor="purpose"
                    className="app-label"
                >
                    Purpose
                </label>

                <textarea
                    id="purpose"
                    name="purpose"
                    className="app-input"
                    value={purpose}
                    onChange={(event) =>
                        setPurpose(event.target.value)
                    }
                    required
                />
            </div>

            {requiresChildrenCount && (
                <div className="mb-4">
                    <label htmlFor="number_of_children" className="app-label">
                        Number of Children
                    </label>
                    <input
                        id="number_of_children"
                        name="request_data[number_of_children]"
                        className="app-input"
                        type="number"
                        min="1"
                        step="1"
                        value={numberOfChildren}
                        onChange={(event) =>
                            setNumberOfChildren(event.target.value)
                        }
                        required
                    />
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="supporting_documents" className="app-label">
                    Supporting Documents (optional)
                </label>
                <input
                    id="supporting_documents"
                    name="supporting_documents"
                    type="file"
                    className="app-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    ref={supportingDocumentsInput}
                    onChange={(event) =>
                        setSupportingDocuments(
                            Array.from(event.target.files || [])
                        )
                    }
                />
                <p className="text-sm text-muted-foreground">
                    Attach up to five PDF or image files. Each file must be
                    10 MB or smaller.
                </p>
            </div>

            {verificationStatus !== "verified" && (
                <div className="app-alert app-alert-info" role="status">
                    Your account must be verified before you can submit a
                    document request.
                </div>
            )}

            {error && (
                <p className="text-destructive">
                    {error}
                </p>
            )}

            {submittedRequest && (
                <div className="app-alert app-alert-success" role="status">
                    <p className="mb-2">
                        Request submitted successfully. Tracking number:{" "}
                        <strong>{submittedRequest.trackingNumber}</strong>
                    </p>
                    {submittedRequest.qrCode && (
                        <div>
                            <p className="mb-2">
                                Scan this QR code to check your request status.
                            </p>
                            <img
                                src={`data:image/svg+xml,${encodeURIComponent(
                                    submittedRequest.qrCode
                                )}`}
                                alt={`Tracking QR code for ${submittedRequest.trackingNumber}`}
                                width="180"
                                height="180"
                            />
                        </div>
                    )}
                </div>
            )}

            <button
                type="submit"
                className="app-button app-button-primary"
                disabled={loading || verificationStatus !== "verified"}
            >
                {loading ? "Submitting..." : "Submit Request"}
            </button>
        </form>
    );
}
