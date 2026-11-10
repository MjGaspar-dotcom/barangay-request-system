import { useMemo, useState } from "react";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const formatDate = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString();
};

const documentLabel = {
    additional_requirement: "Resident requirement",
    prepared_document: "Prepared document",
    signed_document: "Signed document",
};
const EMPTY_DOCUMENTS = [];

export default function RequestWorkflowPanel({
    request,
    onRefresh,
    onDelete,
}) {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [remarks, setRemarks] = useState("");
    const [requirementsComplete, setRequirementsComplete] = useState(
        Boolean(request.requirements_complete),
    );
    const [recipientName, setRecipientName] = useState("");
    const [preparedFile, setPreparedFile] = useState(null);
    const [signedFile, setSignedFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [confirmation, setConfirmation] = useState(null);

    const documents = request.documents ?? EMPTY_DOCUMENTS;
    const history = request.history || [];
    const preparedDocument = useMemo(
        () =>
            documents
                .filter((document) => document.purpose === "prepared_document")
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
        [documents],
    );
    const signedDocument = useMemo(
        () =>
            documents
                .filter((document) => document.purpose === "signed_document")
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
        [documents],
    );

    const runAction = async (action, successMessage) => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await action();
            setMessage(successMessage);
            await onRefresh();
        } catch (actionError) {
            console.error(actionError);
            setError(
                actionError.response?.data?.message ||
                    "The workflow action could not be completed.",
            );
        } finally {
            setBusy(false);
        }
    };

    const confirmAction = (title, body, label, action, variant = "primary") => {
        setConfirmation({
            title,
            body,
            label,
            action,
            variant,
        });
    };

    const updateStatus = (status, extras = {}) =>
        runAction(
            () =>
                api.put(`/barangay-requests/${request.request_id}`, {
                    status,
                    ...extras,
                }),
            `Request updated to ${status}.`,
        );

    const uploadDocument = (purpose, file) => {
        if (!file) {
            setError("Choose a document file before continuing.");
            return;
        }

        const formData = new FormData();
        formData.append("document", file);
        const endpoint =
            purpose === "prepared"
                ? "documents/prepared"
                : "documents/authorize";
        runAction(
            () =>
                api.post(
                    `/barangay-requests/${request.request_id}/${endpoint}`,
                    formData,
                ),
            purpose === "prepared"
                ? "Prepared document uploaded for authorization."
                : "Signed document uploaded and authorization recorded.",
        ).then(() => {
            if (purpose === "prepared") setPreparedFile(null);
            else setSignedFile(null);
        });
    };

    const openDocument = async (document) => {
        setError("");
        try {
            const response = await api.get(
                `/barangay-requests/${request.request_id}/documents/${document.request_document_id}/view`,
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
            setError(
                openError.response?.data?.message ||
                    "The document could not be opened.",
            );
        }
    };

    const openValidId = async (side) => {
        setError("");
        try {
            const response = await api.get(
                `/barangay-requests/${request.request_id}/valid-id/${side}`,
                { responseType: "blob" },
            );
            const url = URL.createObjectURL(response.data);
            const link = window.open(url, "_blank", "noopener,noreferrer");
            if (!link) {
                const download = window.document.createElement("a");
                download.href = url;
                download.download = `${side}-of-id`;
                download.click();
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (openError) {
            console.error(openError);
            setError(
                openError.response?.data?.message ||
                    "The ID image could not be opened.",
            );
        }
    };

    const auditActor = (event) => {
        const actor = event.user || event.staff?.user;
        if (!actor) return "System";
        return [actor.first_name, actor.last_name].filter(Boolean).join(" ");
    };

    return (
        <div className="flex flex-col gap-4">
            {message && (
                <div className="app-alert app-alert-success mb-0" role="status">
                    {message}
                </div>
            )}
            {error && (
                <div className="app-alert app-alert-danger mb-0" role="alert">
                    {error}
                </div>
            )}

            <section className="admin-form-card">
                <h3 className="form-section-title">Requirements Verification</h3>
                <div className="detail-grid">
                    <div>
                        <span className="detail-label">Requirements status</span>
                        <span className="detail-value">
                            {request.verified_at
                                ? `${request.requirements_complete ? "Reviewed as complete" : "Reviewed; additional requirements needed"} ${formatDate(request.verified_at)}`
                                : "Not yet verified"}
                        </span>
                    </div>
                    <div>
                        <span className="detail-label">Valid ID type</span>
                        <span className="detail-value">
                            {request.user?.valid_id_type || "Not provided"}
                        </span>
                    </div>
                </div>
                {(request.user?.valid_id_front || request.user?.valid_id_back) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {[
                            ["Front of ID", "front", request.user.valid_id_front],
                            ["Back of ID", "back", request.user.valid_id_back],
                        ]
                            .filter(([, , path]) => path)
                            .map(([label, side]) => (
                                <button
                                    className="app-button app-button-sm app-button-outline-secondary"
                                    key={label}
                                    onClick={() => openValidId(side)}
                                    type="button"
                                >
                                    View {label}
                                </button>
                            ))}
                    </div>
                )}
                {!request.user?.valid_id_front ||
                !request.user?.valid_id_back ? (
                    <p className="text-sm text-warning-foreground mt-2 mb-0">
                        One or more profile ID images are missing. Review any
                        uploaded requirements and record this review as
                        incomplete if documents are still needed.
                    </p>
                ) : null}
                {request.status === "Pending" && !request.verified_at && (
                    <div className="flex items-center gap-2 mt-4">
                        <input
                            checked={requirementsComplete}
                            className="accent-primary"
                            id={`requirements-complete-${request.request_id}`}
                            onChange={(event) =>
                                setRequirementsComplete(event.target.checked)
                            }
                            type="checkbox"
                        />
                        <label
                            className="text-sm"
                            htmlFor={`requirements-complete-${request.request_id}`}
                        >
                            I reviewed the submitted information and confirm
                            all applicable requirements are complete and valid.
                            Leave unchecked if anything is missing.
                        </label>
                    </div>
                )}
                {request.status === "Pending" && !request.verified_at && (
                    <Button
                        className="app-button app-button-outline-success mt-4"
                        disabled={busy}
                        loading={busy}
                        loadingLabel="Verifying requirements"
                        onClick={() =>
                            confirmAction(
                                "Verify requirements",
                                `Record this review as ${requirementsComplete ? "complete" : "incomplete"}?`,
                                requirementsComplete
                                    ? "Record Complete Review"
                                    : "Record Incomplete Review",
                                () =>
                                    runAction(
                                        () =>
                                            api.post(
                                                `/barangay-requests/${request.request_id}/requirements/verify`,
                                                {
                                                    requirements_complete:
                                                        requirementsComplete,
                                                },
                                            ),
                                        `Requirements review recorded as ${requirementsComplete ? "complete" : "incomplete"}.`,
                                    ),
                            )
                        }
                        type="button"
                    >
                        Record Requirements Review
                    </Button>
                )}
                {!!documents.length && (
                    <div className="mt-4">
                        <span className="detail-label">Request documents</span>
                        <ul className="m-0 list-none p-0">
                            {documents.map((document) => (
                                <li
                                    className="app-list-item px-0 flex justify-between items-center gap-2"
                                    key={document.request_document_id}
                                >
                                    <span>
                                        <strong>
                                            {documentLabel[document.purpose] ||
                                                "Request document"}
                                        </strong>
                                        <small className="block text-muted-foreground">
                                            {document.original_name} ·{" "}
                                            {formatDate(document.created_at)}
                                        </small>
                                    </span>
                                    <Button
                                        className="app-button app-button-sm app-button-outline-primary"
                                        onClick={() => openDocument(document)}
                                        type="button"
                                    >
                                        Preview
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {request.status === "Pending" && (
                <>
                    <section className="admin-form-card">
                        <h3 className="form-section-title">
                            Administrative Assessment / Remarks
                        </h3>
                        <label
                            className="app-label font-semibold"
                            htmlFor={`request-remarks-${request.request_id}`}
                        >
                            Assessment notes
                        </label>
                        <textarea
                            className="app-input"
                            disabled={!isAdmin || busy}
                            id={`request-remarks-${request.request_id}`}
                            maxLength={2000}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder={
                                isAdmin
                                    ? "Record your assessment and observations before deciding."
                                    : "An administrator records the decision remarks after verification."
                            }
                            rows={3}
                            value={remarks}
                        />
                    </section>
                    <section className="admin-form-card">
                        <h3 className="form-section-title">
                            Administrative Decision
                        </h3>
                        {isAdmin ? (
                            <div className="detail-action-footer">
                                <Button
                                    className="app-button app-button-success"
                                    disabled={
                                        busy ||
                                        !request.verified_at ||
                                        !request.requirements_complete ||
                                        !remarks.trim()
                                    }
                                    onClick={() =>
                                        confirmAction(
                                            "Approve request",
                                            "Approve this verified request and move it to document processing?",
                                            "Approve Request",
                                            () =>
                                                updateStatus("Approved", {
                                                    remarks: remarks.trim(),
                                                }),
                                        )
                                    }
                                    type="button"
                                >
                                    Approve Request
                                </Button>
                                <Button
                                    className="app-button app-button-outline-warning"
                                    disabled={
                                        busy ||
                                        !request.verified_at ||
                                        request.requirements_complete ||
                                        !remarks.trim()
                                    }
                                    onClick={() =>
                                        confirmAction(
                                            "Request additional requirements",
                                            "Send the assessment remarks to the resident and return the request for review after resubmission?",
                                            "Request Requirements",
                                            () =>
                                                updateStatus(
                                                    "Additional Requirements",
                                                    { remarks: remarks.trim() },
                                                ),
                                        )
                                    }
                                    type="button"
                                >
                                    Request Additional Requirements
                                </Button>
                                <Button
                                    className="app-button app-button-danger"
                                    disabled={
                                        busy ||
                                        !request.verified_at ||
                                        !remarks.trim()
                                    }
                                    onClick={() =>
                                        confirmAction(
                                            "Reject request",
                                            "Reject this request using the assessment remarks shown above?",
                                            "Reject Request",
                                            () =>
                                                updateStatus("Rejected", {
                                                    remarks: remarks.trim(),
                                                }),
                                            "danger",
                                        )
                                    }
                                    type="button"
                                >
                                    Reject Request
                                </Button>
                            </div>
                        ) : (
                            <p className="mb-0 text-muted-foreground">
                                Only an administrator can record the decision
                                after requirements are verified.
                            </p>
                        )}
                    </section>
                </>
            )}

            {request.status === "Additional Requirements" && (
                <section className="admin-form-card">
                    <h3 className="form-section-title">
                        Waiting for Resident Resubmission
                    </h3>
                    <p className="mb-0">
                        <strong>Missing requirements:</strong>{" "}
                        {request.remarks || "See the assessment history below."}
                    </p>
                </section>
            )}

            {request.status === "Approved" && (
                <section className="admin-form-card">
                    <h3 className="form-section-title">Document Processing</h3>
                    <p>
                        Approved {formatDate(request.approved_at)}. Preparing
                        the document is a separate step from approving the
                        request.
                    </p>
                    <Button
                        className="app-button app-button-primary"
                        disabled={busy}
                        loading={busy}
                        loadingLabel="Starting processing"
                        onClick={() =>
                            confirmAction(
                                "Start document processing",
                                "Start preparing the approved document?",
                                "Start Processing",
                                () => updateStatus("Processing"),
                            )
                        }
                        type="button"
                    >
                        Start Processing
                    </Button>
                </section>
            )}

            {request.status === "Processing" && (
                <section className="admin-form-card">
                    <h3 className="form-section-title">
                        Document Preparation &amp; Authorization
                    </h3>
                    <p>
                        Processing started {formatDate(request.processing_started_at)}.
                        Upload the checked document, then have an administrator
                        upload and authorize the signed copy.
                    </p>
                    <label
                        className="app-label font-semibold"
                        htmlFor={`prepared-document-${request.request_id}`}
                    >
                        Prepared document (PDF, JPG, or PNG)
                    </label>
                    <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="app-input mb-2"
                        disabled={busy}
                        id={`prepared-document-${request.request_id}`}
                        onChange={(event) =>
                            setPreparedFile(event.target.files?.[0] || null)
                        }
                        type="file"
                    />
                    <Button
                        className="app-button app-button-outline-primary"
                        disabled={busy || !preparedFile}
                        loading={busy}
                        loadingLabel="Uploading document"
                        onClick={() =>
                            uploadDocument("prepared", preparedFile)
                        }
                        type="button"
                    >
                        Upload Prepared Document
                    </Button>
                    {preparedDocument && (
                        <p className="mt-2 mb-0">
                            Prepared document uploaded{" "}
                            {formatDate(request.document_prepared_at)}.{" "}
                            <Button
                                className="app-button app-button-link p-0"
                                onClick={() => openDocument(preparedDocument)}
                                type="button"
                            >
                                Preview
                            </Button>
                        </p>
                    )}
                    {isAdmin && request.document_prepared_at && (
                        <div className="border-t mt-4 pt-3">
                            <label
                                className="app-label font-semibold"
                                htmlFor={`signed-document-${request.request_id}`}
                            >
                                Authorized signed document
                            </label>
                            <input
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="app-input mb-2"
                                disabled={busy || !!request.document_signed_at}
                                id={`signed-document-${request.request_id}`}
                                onChange={(event) =>
                                    setSignedFile(
                                        event.target.files?.[0] || null,
                                    )
                                }
                                type="file"
                            />
                            <Button
                                className="app-button app-button-outline-success"
                                disabled={
                                    busy ||
                                    !signedFile ||
                                    !!request.document_signed_at
                                }
                                loading={busy}
                                loadingLabel="Recording authorization"
                                onClick={() =>
                                    uploadDocument("signed", signedFile)
                                }
                                type="button"
                            >
                                Upload Signed Document &amp; Authorize
                            </Button>
                        </div>
                    )}
                    {!isAdmin && request.document_prepared_at && (
                        <p className="mt-4 mb-0 text-muted-foreground">
                            Waiting for an administrator to authorize the
                            signed document.
                        </p>
                    )}
                    {request.document_signed_at && (
                        <p className="mt-4">
                            Authorized {formatDate(request.document_signed_at)}.
                            {signedDocument && (
                                <>
                                    {" "}
                                    <Button
                                        className="app-button app-button-link p-0"
                                        onClick={() => openDocument(signedDocument)}
                                        type="button"
                                    >
                                        Preview signed document
                                    </Button>
                                </>
                            )}
                        </p>
                    )}
                    <Button
                        className="app-button app-button-info mt-4"
                        disabled={busy || !request.document_signed_at}
                        loading={busy}
                        loadingLabel="Updating request"
                        onClick={() =>
                            confirmAction(
                                "Mark ready for pickup",
                                "Confirm that the document has been prepared, checked, and authorized with a signature.",
                                "Mark Ready for Pickup",
                                () => updateStatus("Ready for Pickup"),
                            )
                        }
                        type="button"
                    >
                        Mark Ready for Pickup
                    </Button>
                </section>
            )}

            {request.status === "Ready for Pickup" && (
                <section className="admin-form-card">
                    <h3 className="form-section-title">Confirm Document Release</h3>
                    <p>
                        Signed document is ready for collection. Record the
                        person who receives it before completing the request.
                    </p>
                    <label
                        className="app-label font-semibold"
                        htmlFor={`recipient-name-${request.request_id}`}
                    >
                        Recipient name
                    </label>
                    <input
                        className="app-input mb-4"
                        disabled={busy}
                        id={`recipient-name-${request.request_id}`}
                        maxLength={255}
                        onChange={(event) =>
                            setRecipientName(event.target.value)
                        }
                        value={recipientName}
                    />
                    <Button
                        className="app-button app-button-success"
                        disabled={busy || !recipientName.trim()}
                        loading={busy}
                        loadingLabel="Recording release"
                        onClick={() =>
                            confirmAction(
                                "Confirm document release",
                                `Record release of this document to ${recipientName.trim()}?`,
                                "Confirm Release",
                                () =>
                                    updateStatus("Completed", {
                                        recipient_name: recipientName.trim(),
                                    }),
                            )
                        }
                        type="button"
                    >
                        Confirm Release / Complete Request
                    </Button>
                </section>
            )}

            {(request.status === "Rejected" ||
                request.status === "Completed") && (
                <section className="admin-form-card">
                    <h3 className="form-section-title">
                        {request.status === "Rejected"
                            ? "Rejection Reason"
                            : "Release Record"}
                    </h3>
                    <p>
                        {request.status === "Rejected"
                            ? request.remarks || "No rejection reason recorded."
                            : `Released to ${request.release_recipient_name || "recipient not recorded"} by ${formatDate(request.claimed_at)}.`}
                    </p>
                    <p className="mb-0 text-muted-foreground">
                        This request is terminal. Review its transaction history
                        below.
                    </p>
                </section>
            )}

            <section className="admin-form-card">
                <h3 className="form-section-title">Transaction History</h3>
                {history.length ? (
                    <ul className="timeline">
                        <li className="timeline-item done">
                            <span className="timeline-dot" />
                            <div>
                                <strong>Request submitted</strong>
                                <div className="timeline-date">
                                    {formatDate(request.created_at)}
                                </div>
                            </div>
                        </li>
                        {history.map((event) => (
                            <li
                                className="timeline-item done"
                                key={event.audit_log_id}
                            >
                                <span className="timeline-dot" />
                                <div>
                                    <strong>
                                        {event.action.replaceAll("_", " ")}
                                    </strong>
                                    <div className="timeline-date">
                                        {formatDate(event.created_at)} ·{" "}
                                        {auditActor(event)}
                                    </div>
                                    {event.description && (
                                        <p className="mb-0 mt-1 text-sm">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mb-0 text-muted-foreground">
                        No transaction events have been recorded.
                    </p>
                )}
            </section>

            {isAdmin && request.status === "Pending" && onDelete && (
                <div className="flex justify-end">
                    <Button
                        className="app-button app-button-outline-danger"
                        disabled={busy}
                        onClick={onDelete}
                        type="button"
                    >
                        Delete Pending Request
                    </Button>
                </div>
            )}

            <ConfirmDialog
                confirmLabel={confirmation?.label}
                isOpen={Boolean(confirmation)}
                onClose={() => setConfirmation(null)}
                onConfirm={() => {
                    const action = confirmation?.action;
                    setConfirmation(null);
                    if (action) action();
                }}
                title={confirmation?.title}
                variant={confirmation?.variant}
            >
                {confirmation?.body}
            </ConfirmDialog>
        </div>
    );
}
