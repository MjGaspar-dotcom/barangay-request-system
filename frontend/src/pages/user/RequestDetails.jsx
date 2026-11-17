import { useEffect, useRef, useState } from "react";
import { Button, LinearProgress } from "@mui/material";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../components/ui/StatusBadge";
import RequestTimeline from "../../components/requests/RequestTimeline";
import api from "../../services/api";
import {
    isInCurrentWorkflow,
    requestStatusLabel,
} from "../../utils/requestWorkflow";
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
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [busyDocumentId, setBusyDocumentId] = useState(null);
    const [numberOfChildren, setNumberOfChildren] = useState("");
    const [savingChildrenCount, setSavingChildrenCount] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const replacementInput = useRef(null);
    const replacementDocumentId = useRef(null);

    useEffect(() => {
        let active = true;
        api.get(`/barangay-requests/${requestId}`)
            .then((response) => {
                if (!active) return;
                if (isInCurrentWorkflow(response.data.data)) {
                    setRequest(response.data.data);
                } else {
                    setError("Request not found.");
                }
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

    const openDocument = async (document) => {
        setActionError("");
        setActionMessage("");
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

    const chooseReplacement = (documentId) => {
        replacementDocumentId.current = documentId;
        replacementInput.current?.click();
    };

    const replaceSupportingDocument = async (event) => {
        const file = event.target.files?.[0];
        const documentId = replacementDocumentId.current;
        event.target.value = "";
        if (!file || !documentId) return;

        if (file.size > 10 * 1024 * 1024) {
            setActionError("Each supporting document must be 10 MB or smaller.");
            return;
        }

        setActionError("");
        setActionMessage("");
        setBusyDocumentId(documentId);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append("_method", "PUT");
        formData.append("document", file);

        try {
            const response = await api.post(
                `/barangay-requests/${requestId}/documents/${documentId}`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            setUploadProgress(
                                Math.round(
                                    (progressEvent.loaded / progressEvent.total) * 100,
                                ),
                            );
                        }
                    },
                },
            );
            const replacement = response.data?.data;
            setRequest((current) => ({
                ...current,
                documents: current.documents.map((document) =>
                    document.request_document_id === documentId
                        ? replacement
                        : document,
                ),
            }));
            setActionMessage("Supporting document replaced successfully.");
        } catch (replaceError) {
            console.error(replaceError);
            setActionError(
                replaceError.response?.data?.message ||
                    "Could not replace the supporting document.",
            );
        } finally {
            setBusyDocumentId(null);
        }
    };

    const deleteSupportingDocument = async (document) => {
        if (!window.confirm(`Remove "${document.original_name}" from this request?`)) {
            return;
        }

        setActionError("");
        setActionMessage("");
        setBusyDocumentId(document.request_document_id);
        try {
            await api.delete(
                `/barangay-requests/${requestId}/documents/${document.request_document_id}`,
            );
            setRequest((current) => ({
                ...current,
                documents: current.documents.filter(
                    (item) =>
                        item.request_document_id !== document.request_document_id,
                ),
            }));
            setActionMessage("Supporting document removed.");
        } catch (deleteError) {
            console.error(deleteError);
            setActionError(
                deleteError.response?.data?.message ||
                    "Could not remove the supporting document.",
            );
        } finally {
            setBusyDocumentId(null);
        }
    };

    const saveChildrenCount = async (event) => {
        event.preventDefault();
        setActionError("");
        setActionMessage("");
        setSavingChildrenCount(true);

        try {
            const response = await api.patch(
                `/barangay-requests/${requestId}/solo-parent-details`,
                { number_of_children: numberOfChildren },
            );
            const count = response.data?.data?.number_of_children;
            setRequest((current) => ({
                ...current,
                request_data: {
                    ...(current.request_data || {}),
                    number_of_children: count,
                },
                document_generation_status: "queued",
                document_generation_error: null,
            }));
            setActionMessage(
                response.data?.message ||
                    "Children details saved. The PDF is being generated.",
            );
        } catch (saveError) {
            console.error(saveError);
            setActionError(
                saveError.response?.data?.message ||
                    "The number of children could not be saved.",
            );
        } finally {
            setSavingChildrenCount(false);
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

    const preparedDocument = (request.documents || []).find(
        (document) =>
            document.purpose === "prepared_document" &&
            document.request_document_id === request.prepared_document_id,
    );
    const isSoloParentRequest =
        request.document_type?.document_name === "Certificate of Solo Parent";
    const hasChildrenCount =
        request.request_data?.number_of_children !== undefined &&
        request.request_data?.number_of_children !== null &&
        request.request_data?.number_of_children !== "";

    return (
        <RequestDetailsPage>
            <RequestDetailsCard>
                <RequestDetailsHeader>
                    <div>
                        <h1>Request Details</h1>
                        <p className="mb-0 mt-2 text-muted-foreground">
                            {request.tracking_number}
                        </p>
                    </div>
                    <StatusBadge status={request.status} />
                </RequestDetailsHeader>

                {actionError && (
                    <div className="app-alert app-alert-danger" role="alert">
                        {actionError}
                    </div>
                )}
                {actionMessage && (
                    <div className="app-alert app-alert-success" role="status">
                        {actionMessage}
                    </div>
                )}
                <input
                    ref={replacementInput}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={replaceSupportingDocument}
                />

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
                            <RequestDetailValue>
                                {requestStatusLabel(request.status)}
                            </RequestDetailValue>
                        </RequestDetailItem>
                        <RequestDetailItem>
                            <RequestDetailLabel>Purpose</RequestDetailLabel>
                            <RequestDetailValue>{request.purpose}</RequestDetailValue>
                        </RequestDetailItem>
                        {isSoloParentRequest && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Number of Children
                                </RequestDetailLabel>
                                <RequestDetailValue>
                                    {hasChildrenCount
                                        ? request.request_data.number_of_children
                                        : "Not provided"}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                        <RequestDetailItem>
                            <RequestDetailLabel>Submitted</RequestDetailLabel>
                            <RequestDetailValue>
                                {formatDate(request.created_at)}
                            </RequestDetailValue>
                        </RequestDetailItem>
                        {request.decision_at && request.remarks && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Decision feedback
                                </RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.remarks}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                        {request.decision_at && request.rejection_reason && (
                            <RequestDetailItem>
                                <RequestDetailLabel>Rejection reason</RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.rejection_reason}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                        {request.decision_at && request.rejection_other && (
                            <RequestDetailItem>
                                <RequestDetailLabel>
                                    Additional explanation
                                </RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.rejection_other}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                        {request.status === "completed" && (
                            <RequestDetailItem>
                                <RequestDetailLabel>Released to</RequestDetailLabel>
                                <RequestDetailValue>
                                    {request.release_recipient_name || "—"}
                                </RequestDetailValue>
                            </RequestDetailItem>
                        )}
                    </RequestDetailsGrid>
                </RequestDetailsSection>

                {isSoloParentRequest &&
                    request.status === "request_submitted" &&
                    !hasChildrenCount && (
                        <RequestDetailsSection>
                            <RequestDetailsSectionTitle>
                                Complete Solo Parent Details
                            </RequestDetailsSectionTitle>
                            <p>
                                Enter the number of children so the Solo Parent
                                certificate can be generated.
                            </p>
                            <form onSubmit={saveChildrenCount}>
                                <div className="mb-4">
                                    <label
                                        className="app-label"
                                        htmlFor="request-number-of-children"
                                    >
                                        Number of Children
                                    </label>
                                    <input
                                        className="app-input"
                                        id="request-number-of-children"
                                        min="1"
                                        onChange={(event) =>
                                            setNumberOfChildren(
                                                event.target.value,
                                            )
                                        }
                                        required
                                        step="1"
                                        type="number"
                                        value={numberOfChildren}
                                    />
                                </div>
                                <Button
                                    disabled={savingChildrenCount}
                                    type="submit"
                                    variant="contained"
                                >
                                    {savingChildrenCount
                                        ? "Saving..."
                                        : "Save and Generate PDF"}
                                </Button>
                            </form>
                        </RequestDetailsSection>
                    )}

                <RequestTimeline request={request} />

                {preparedDocument &&
                    ["ready_for_pickup", "completed"].includes(request.status) && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>
                            Approved Document
                        </RequestDetailsSectionTitle>
                        <div className="flex items-center justify-between gap-2">
                            <span>{preparedDocument.original_name}</span>
                            <Button
                                onClick={() => openDocument(preparedDocument)}
                                type="button"
                                variant="outlined"
                            >
                                Preview Document
                            </Button>
                        </div>
                    </RequestDetailsSection>
                )}

                {!!(request.documents || []).filter(
                    (document) => document.purpose === "additional_requirement",
                ).length && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>Supporting Documents</RequestDetailsSectionTitle>
                        <ul className="m-0 list-none p-0">
                            {request.documents
                                .filter((document) => document.purpose === "additional_requirement")
                                .map((document) => (
                                <li
                                    className="app-list-item flex justify-between items-center gap-2"
                                    key={document.request_document_id}
                                >
                                    <span>
                                        {document.original_name}
                                        <small className="block text-muted-foreground">
                                            Submitted {formatDate(document.created_at)}
                                        </small>
                                    </span>
                                    <Button
                                        onClick={() => openDocument(document)}
                                        type="button"
                                        variant="outlined"
                                        disabled={busyDocumentId === document.request_document_id}
                                    >
                                        View
                                    </Button>
                                    {request.status === "request_submitted" && (
                                        <>
                                            <Button
                                                onClick={() => chooseReplacement(document.request_document_id)}
                                                type="button"
                                                variant="outlined"
                                                disabled={busyDocumentId !== null}
                                            >
                                                Replace
                                            </Button>
                                            <Button
                                                onClick={() => deleteSupportingDocument(document)}
                                                type="button"
                                                color="error"
                                                disabled={busyDocumentId !== null}
                                            >
                                                Remove
                                            </Button>
                                        </>
                                    )}
                                    {busyDocumentId === document.request_document_id && (
                                        <span aria-live="polite">
                                            {uploadProgress > 0
                                                ? `${uploadProgress}%`
                                                : "Saving..."}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {busyDocumentId !== null && (
                            <LinearProgress
                                variant="determinate"
                                value={uploadProgress}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </RequestDetailsSection>
                )}

                {!!request.history?.length && (
                    <RequestDetailsSection>
                        <RequestDetailsSectionTitle>
                            Transaction History
                        </RequestDetailsSectionTitle>
                        <ul className="m-0 list-none p-0">
                            {request.history.map((event) => (
                                <li
                                    className="app-list-item"
                                    key={event.audit_log_id}
                                >
                                    <strong>{event.action.replaceAll("_", " ")}</strong>
                                    <span className="block text-muted-foreground text-sm">
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
