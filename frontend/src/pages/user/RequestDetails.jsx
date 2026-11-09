import { useCallback, useEffect, useState } from "react";
import { Button } from "@mui/material";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
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

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

function RequestDetails() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notes, setNotes] = useState("");
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        let active = true;
        api.get(`/barangay-requests/${requestId}`)
            .then((response) => {
                if (active) setRequest(response.data.data);
            })
            .catch((requestError) => {
                console.error(requestError);
                if (!active) return;
                if (requestError.response?.status === 403) {
                    setError("You are not authorized to view this request.");
                } else if (requestError.response?.status === 404) {
                    setError("Request not found.");
                } else {
                    setError("Failed to load request details.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [requestId]);

    const fetchRequest = useCallback(async () => {
        try {
            const response = await api.get(
                `/barangay-requests/${requestId}`,
            );
            setRequest(response.data.data);
        } catch (requestError) {
            console.error(requestError);
            setActionError(
                "Requirements were submitted, but request details could not be refreshed.",
            );
        }
    }, [requestId]);

    const submitRequirements = async (event) => {
        event.preventDefault();
        setActionMessage("");
        setActionError("");
        if (!notes.trim() || !files.length) {
            setActionError(
                "Add a note and attach at least one requested requirement.",
            );
            return;
        }

        const formData = new FormData();
        formData.append("notes", notes.trim());
        files.forEach((file, index) => {
            formData.append(`documents[${index}]`, file);
        });

        setSubmitting(true);
        try {
            await api.post(
                `/barangay-requests/${requestId}/requirements/resubmit`,
                formData,
            );
            setNotes("");
            setFiles([]);
            setActionMessage(
                "Your additional requirements have been submitted for review.",
            );
            await fetchRequest();
        } catch (submitError) {
            console.error(submitError);
            setActionError(
                submitError.response?.data?.message ||
                    "Unable to submit the additional requirements.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const openDocument = async (document) => {
        setActionError("");
        try {
            const response = await api.get(
                `/barangay-requests/${requestId}/documents/${document.request_document_id}/view`,
                { responseType: "blob" },
            );
            const url = URL.createObjectURL(response.data);
            const link = window.open(url, "_blank", "noopener,noreferrer");
            if (!link) {
                const download = window.document.createElement("a");
                download.href = url;
                download.download = document.original_name;
                download.click();
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (openError) {
            console.error(openError);
            setActionError(
                openError.response?.data?.message ||
                    "The document could not be opened.",
            );
        }
    };

    if (
        loading ||
        (!error && request?.request_id !== Number(requestId))
    ) {
        return (
            <RequestPageState>
                <SkeletonLoader label="Loading request details" variant="detail" />
            </RequestPageState>
        );
    }

    if (error) {
        return (
            <RequestPageState>
                <RequestErrorMessage>{error}</RequestErrorMessage>
                <Button
                    onClick={() => navigate("/dashboard")}
                    type="button"
                    variant="outlined"
                >
                    Back to Dashboard
                </Button>
            </RequestPageState>
        );
    }

    if (!request) return null;

    const residentDocuments = (request.documents || []).filter(
        (document) => document.purpose === "additional_requirement",
    );

    return (
        <RequestDetailsPage>
            <RequestDetailsCard>
                <RequestDetailsHeader>
                    <div>
                        <h1>Request Details</h1>
                        <p className="mb-0 mt-2 text-muted">
                            {request.tracking_number}
                        </p>
                    </div>
                    <StatusBadge status={request.status} />
                </RequestDetailsHeader>

                {actionMessage && (
                    <div className="alert alert-success" role="status">
                        {actionMessage}
                    </div>
                )}
                {actionError && (
                    <div className="alert alert-danger" role="alert">
                        {actionError}
                    </div>
                )}

                <RequestDetailsSection>
                    <RequestDetailsSectionTitle>
                        Request Information
                    </RequestDetailsSectionTitle>
                    <RequestDetailsGrid>
                        <RequestDetailItem>
                            <RequestDetailLabel>Document</RequestDetailLabel>
                            <RequestDetailValue>
                                {request.document_type?.document_name || "Unknown"}
                            </RequestDetailValue>
                        </RequestDetailItem>
                        <RequestDetailItem>
                            <RequestDetailLabel>Status</RequestDetailLabel>
                            <RequestDetailValue>{request.status}</RequestDetailValue>
                        </RequestDetailItem>
                        <RequestDetailItem>
                            <RequestDetailLabel>Purpose</RequestDetailLabel>
                            <RequestDetailValue>{request.purpose}</RequestDetailValue>
                        </RequestDetailItem>
                        <RequestDetailItem>
                            <RequestDetailLabel>Submitted</RequestDetailLabel>
                            <RequestDetailValue>
                                {formatDate(request.created_at)}
                            </RequestDetailValue>
                        </RequestDetailItem>
                        {request.remarks && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Latest Administrative Remarks
                                </RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.remarks}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                        {request.status === "Completed" && (
                            <RequestDetailItem>
                                <RequestDetailLabel>Released to</RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.release_recipient_name || "—"}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                    </RequestDetailsGrid>
                </RequestDetailsSection>

                {request.status === "Additional Requirements" && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>
                            Submit Additional Requirements
                        </RequestDetailsSectionTitle>
                        <p>
                            Your request needs the following information or
                            documents: <strong>{request.remarks}</strong>
                        </p>
                        <form onSubmit={submitRequirements}>
                            <label
                                className="form-label"
                                htmlFor="resubmission-notes"
                            >
                                Notes for the reviewer
                            </label>
                            <textarea
                                className="form-control mb-3"
                                id="resubmission-notes"
                                maxLength={2000}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                required
                                rows={3}
                                value={notes}
                            />
                            <label
                                className="form-label"
                                htmlFor="resubmission-documents"
                            >
                                Attach requirements (PDF, JPG, or PNG; up to 5
                                files, 10 MB each)
                            </label>
                            <input
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="form-control mb-3"
                                id="resubmission-documents"
                                multiple
                                onChange={(event) =>
                                    setFiles(Array.from(event.target.files || []))
                                }
                                required
                                type="file"
                            />
                            <Button
                                disabled={submitting || !notes.trim() || !files.length}
                                type="submit"
                                variant="contained"
                            >
                                {submitting
                                    ? "Submitting requirements..."
                                    : "Submit for Review"}
                            </Button>
                        </form>
                    </RequestDetailsSection>
                )}

                {!!residentDocuments.length && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>
                            Submitted Requirements
                        </RequestDetailsSectionTitle>
                        <ul className="list-group">
                            {residentDocuments.map((document) => (
                                <li
                                    className="list-group-item d-flex justify-content-between align-items-center gap-2"
                                    key={document.request_document_id}
                                >
                                    <span>
                                        {document.original_name}
                                        <small className="d-block text-muted">
                                            Submitted {formatDate(document.created_at)}
                                        </small>
                                    </span>
                                    <Button
                                        onClick={() => openDocument(document)}
                                        type="button"
                                        variant="outlined"
                                    >
                                        View
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </RequestDetailsSection>
                )}

                {!!request.history?.length && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>
                            Transaction History
                        </RequestDetailsSectionTitle>
                        <ul className="list-group">
                            {request.history.map((event) => (
                                <li
                                    className="list-group-item"
                                    key={event.audit_log_id}
                                >
                                    <strong>{event.action.replaceAll("_", " ")}</strong>
                                    <span className="d-block text-muted small">
                                        {formatDate(event.created_at)}
                                    </span>
                                    <span>{event.description}</span>
                                </li>
                            ))}
                        </ul>
                    </RequestDetailsSection>
                )}

                <RequestBackRow>
                    <Button
                        onClick={() => navigate("/dashboard")}
                        type="button"
                        variant="outlined"
                    >
                        Back to Dashboard
                    </Button>
                </RequestBackRow>
            </RequestDetailsCard>
        </RequestDetailsPage>
    );
}

export default RequestDetails;
