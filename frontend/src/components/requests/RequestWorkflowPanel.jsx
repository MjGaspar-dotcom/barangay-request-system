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

    const auditActor = (event) => {
        const actor = event.user || event.staff?.user;
        if (!actor) return "System";
        return [actor.first_name, actor.last_name].filter(Boolean).join(" ");
    };

    const resubmissionEvent = [...history]
        .reverse()
        .find((event) => event.action === "requirements_resubmitted");
    const decisionEvent = [...history]
        .reverse()
        .find(
            (event) =>
                (!resubmissionEvent ||
                    new Date(event.created_at) >
                        new Date(resubmissionEvent.created_at)) &&
                event.new_values?.status &&
                ["Approved", "Additional Requirements", "Rejected"].includes(
                    event.new_values.status,
                ),
        );
    let currentStage = "requirements";
    if (request.status === "Pending" && request.verified_at) {
        currentStage = "decision";
    } else if (request.status === "Additional Requirements") {
        currentStage = "resubmission";
    } else if (request.status === "Approved") {
        currentStage = "processing";
    } else if (request.status === "Processing") {
        currentStage = request.document_prepared_at
            ? request.document_signed_at
                ? "ready"
                : "authorization"
            : "preparation";
    } else if (request.status === "Ready for Pickup") {
        currentStage = "release";
    }

    const timeline = [
        {
            key: "submitted",
            label: "Submitted",
            completed: true,
            date: request.created_at,
        },
        {
            key: "requirements",
            label: "Requirements verified",
            completed: Boolean(request.verified_at),
            date: request.verified_at,
        },
        {
            key: "decision",
            label: "Administrative decision",
            completed: Boolean(decisionEvent),
            date: decisionEvent?.created_at,
        },
        {
            key: "resubmission",
            label: "Resident resubmission",
            completed: Boolean(resubmissionEvent),
            date: resubmissionEvent?.created_at,
            applicable:
                request.status === "Additional Requirements" ||
                Boolean(resubmissionEvent),
        },
        {
            key: "processing",
            label: "Processing started",
            completed: Boolean(request.processing_started_at),
            date: request.processing_started_at,
        },
        {
            key: "preparation",
            label: "Document prepared and checked",
            completed: Boolean(request.document_prepared_at),
            date: request.document_prepared_at,
        },
        {
            key: "authorization",
            label: "Authorized and signed",
            completed: Boolean(request.document_signed_at),
            date: request.document_signed_at,
        },
        {
            key: "ready",
            label: "Ready for Pickup",
            completed: Boolean(request.ready_for_pickup_at),
            date: request.ready_for_pickup_at,
        },
        {
            key: "release",
            label: "Released / Completed",
            completed: Boolean(request.claimed_at),
            date: request.claimed_at,
        },
    ];

    return (
        <div className="d-flex flex-column gap-3">
            {message && (
                <div className="alert alert-success mb-0" role="status">
                    {message}
                </div>
            )}
            {error && (
                <div className="alert alert-danger mb-0" role="alert">
                    {error}
                </div>
            )}

            <section className="admin-form-card">
                <h3 className="form-section-title">Processing Timeline</h3>
                <ul className="timeline">
                    {timeline.map((step) => {
                        const isCurrent =
                            step.key === currentStage && !step.completed;
                        const notApplicable =
                            request.status === "Rejected" &&
                            [
                                "resubmission",
                                "processing",
                                "preparation",
                                "authorization",
                                "ready",
                                "release",
                            ].includes(step.key);
                        const notRequired = step.applicable === false;

                        return (
                            <li
                                className={`timeline-item ${
                                    step.completed ? "done" : "pending"
                                }`}
                                key={step.key}
                            >
                                <span className="timeline-dot" />
                                <div>
                                    <strong>{step.label}</strong>
                                    <div className="timeline-date">
                                        {step.completed
                                            ? formatDate(step.date)
                                            : notApplicable
                                              ? "Not applicable — request rejected"
                                              : notRequired
                                                ? "Not required"
                                              : isCurrent
                                                ? "Current step"
                                                : "Upcoming"}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

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
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {[
                            ["Front of ID", request.user.valid_id_front],
                            ["Back of ID", request.user.valid_id_back],
                        ]
                            .filter(([, path]) => path)
                            .map(([label, path]) => (
                                <a
                                    className="btn btn-sm btn-outline-secondary"
                                    href={`${api.defaults.baseURL.replace(/\/api\/?$/, "")}/storage/${path}`}
                                    key={label}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    View {label}
                                </a>
                            ))}
                    </div>
                )}
                {!request.user?.valid_id_front ||
                !request.user?.valid_id_back ? (
                    <p className="small text-warning-emphasis mt-2 mb-0">
                        One or more profile ID images are missing. Review any
                        uploaded requirements and record this review as
                        incomplete if documents are still needed.
                    </p>
                ) : null}
                {request.status === "Pending" && !request.verified_at && (
                    <div className="form-check mt-3">
                        <input
                            checked={requirementsComplete}
                            className="form-check-input"
                            id={`requirements-complete-${request.request_id}`}
                            onChange={(event) =>
                                setRequirementsComplete(event.target.checked)
                            }
                            type="checkbox"
                        />
                        <label
                            className="form-check-label"
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
                        className="btn btn-outline-success mt-3"
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
                    <div className="mt-3">
                        <span className="detail-label">Request documents</span>
                        <ul className="list-group list-group-flush">
                            {documents.map((document) => (
                                <li
                                    className="list-group-item px-0 d-flex justify-content-between align-items-center gap-2"
                                    key={document.request_document_id}
                                >
                                    <span>
                                        <strong>
                                            {documentLabel[document.purpose] ||
                                                "Request document"}
                                        </strong>
                                        <small className="d-block text-muted">
                                            {document.original_name} ·{" "}
                                            {formatDate(document.created_at)}
                                        </small>
                                    </span>
                                    <Button
                                        className="btn btn-sm btn-outline-primary"
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
                            className="form-label fw-semibold"
                            htmlFor={`request-remarks-${request.request_id}`}
                        >
                            Assessment notes
                        </label>
                        <textarea
                            className="form-control"
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
                                    className="btn btn-success"
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
                                    className="btn btn-outline-warning"
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
                                    className="btn btn-danger"
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
                            <p className="mb-0 text-muted">
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
                        className="btn btn-primary"
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
                        className="form-label fw-semibold"
                        htmlFor={`prepared-document-${request.request_id}`}
                    >
                        Prepared document (PDF, JPG, or PNG)
                    </label>
                    <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="form-control mb-2"
                        disabled={busy}
                        id={`prepared-document-${request.request_id}`}
                        onChange={(event) =>
                            setPreparedFile(event.target.files?.[0] || null)
                        }
                        type="file"
                    />
                    <Button
                        className="btn btn-outline-primary"
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
                                className="btn btn-link p-0"
                                onClick={() => openDocument(preparedDocument)}
                                type="button"
                            >
                                Preview
                            </Button>
                        </p>
                    )}
                    {isAdmin && request.document_prepared_at && (
                        <div className="border-top mt-3 pt-3">
                            <label
                                className="form-label fw-semibold"
                                htmlFor={`signed-document-${request.request_id}`}
                            >
                                Authorized signed document
                            </label>
                            <input
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="form-control mb-2"
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
                                className="btn btn-outline-success"
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
                        <p className="mt-3 mb-0 text-muted">
                            Waiting for an administrator to authorize the
                            signed document.
                        </p>
                    )}
                    {request.document_signed_at && (
                        <p className="mt-3">
                            Authorized {formatDate(request.document_signed_at)}.
                            {signedDocument && (
                                <>
                                    {" "}
                                    <Button
                                        className="btn btn-link p-0"
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
                        className="btn btn-info mt-3"
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
                        className="form-label fw-semibold"
                        htmlFor={`recipient-name-${request.request_id}`}
                    >
                        Recipient name
                    </label>
                    <input
                        className="form-control mb-3"
                        disabled={busy}
                        id={`recipient-name-${request.request_id}`}
                        maxLength={255}
                        onChange={(event) =>
                            setRecipientName(event.target.value)
                        }
                        value={recipientName}
                    />
                    <Button
                        className="btn btn-success"
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
                    <p className="mb-0 text-muted">
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
                                        <p className="mb-0 mt-1 small">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mb-0 text-muted">
                        No transaction events have been recorded.
                    </p>
                )}
            </section>

            {isAdmin && request.status === "Pending" && onDelete && (
                <div className="d-flex justify-content-end">
                    <Button
                        className="btn btn-outline-danger"
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
