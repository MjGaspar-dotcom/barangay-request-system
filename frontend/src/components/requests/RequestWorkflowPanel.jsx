import { useState } from "react";
import Button from "../ui/Button";
import DocumentPreview from "../documents/DocumentPreview";
import api from "../../services/api";
import { canonicalRequestStatus } from "../../utils/requestWorkflow";

const REJECTION_REASONS = [
    "Incomplete Requirements",
    "Invalid or Incorrect Information",
    "Unverified Residency",
    "Duplicate Request",
    "Document Requirements Not Met",
    "Other",
];

export default function RequestWorkflowPanel({
    request,
    documentPreview,
    onRefresh,
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionOther, setRejectionOther] = useState("");

    const status = canonicalRequestStatus(request.status);
    const isSubmitted = status === "request_submitted";
    const isApproved = status === "approved";
    const isReady = status === "ready_for_pickup";
    const isCompleted = status === "completed";
    const isRejected = status === "rejected";

    const runAction = async (action, successMessage) => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await action();
            setMessage(successMessage);
            await onRefresh();
            return true;
        } catch (actionError) {
            console.error(actionError);
            setError(
                actionError.response?.data?.message ||
                    "The request action could not be completed.",
            );
            return false;
        } finally {
            setBusy(false);
        }
    };

    const updateStatus = (nextStatus, details = {}) =>
        runAction(
            () =>
                api.put(`/barangay-requests/${request.request_id}`, {
                    status: nextStatus,
                    ...details,
                }),
            nextStatus === "approved"
                ? "Request approved."
                : nextStatus === "rejected"
                  ? "Request rejected."
                  : nextStatus === "ready_for_pickup"
                    ? "Official document generated; request is ready for pickup."
                    : "Request marked completed.",
        );

    const approveForPickup = async () => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await api.post(
                `/barangay-requests/${request.request_id}/approve-and-prepare`,
                {},
            );
            setMessage("Request approved and ready for pickup.");
            await onRefresh();
        } catch (approvalError) {
            console.error(approvalError);
            setError(
                approvalError.response?.data?.message ||
                      "The document could not be approved and prepared.",
            );
        } finally {
            setBusy(false);
        }
    };

    const generateLegacyDocument = () =>
        runAction(
            () =>
                api.post(
                    `/barangay-requests/${request.request_id}/generated-document/generate`,
                    {},
                ),
            "Official document generated.",
        );

    const printGeneratedDocument = async () => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            const response = await api.post(
                `/barangay-requests/${request.request_id}/generated-document/print`,
            );
            setMessage(
                response.data.data.action === "document_reprinted"
                    ? "Reprint activity recorded."
                    : "Print activity recorded.",
            );
            window.requestAnimationFrame(() => window.print());
        } catch (printError) {
            console.error(printError);
            setError(
                printError.response?.data?.message ||
                    "The document could not be sent to print.",
            );
        } finally {
            setBusy(false);
        }
    };

    const rejectRequest = async (event) => {
        event.preventDefault();
        const rejected = await updateStatus("rejected", {
            rejection_reason: rejectionReason,
            rejection_other:
                rejectionReason === "Other" ? rejectionOther.trim() : null,
        });
        if (rejected) setRejecting(false);
    };

    const steps = [
        {
            label: "Request submitted",
            complete: true,
            tone: "request-submitted",
        },
        {
            label: isRejected
                ? "Rejected"
                : isApproved || isReady || isCompleted
                  ? "Approved"
                  : "Awaiting decision",
            complete: !isSubmitted && !isRejected,
            current: isSubmitted,
            failed: isRejected,
            tone: isRejected
                ? "rejected"
                : isSubmitted
                  ? "request-submitted"
                  : "approved",
        },
        {
            label: "Ready for pickup",
            complete: isReady || isCompleted,
            current: isApproved,
            upcoming: isSubmitted || isRejected,
            tone: "ready-for-pickup",
        },
        {
            label: "Completed",
            complete: isCompleted,
            current: isReady,
            upcoming: isSubmitted || isApproved || isRejected,
            tone: "completed",
        },
    ];

    return (
        <div className="request-processing-grid grid items-start gap-4">
            <aside className="admin-form-card request-progress-card">
                <h2 className="form-section-title">Request Progress</h2>
                <ol className="m-0 list-none space-y-3 p-0">
                    {steps.map((step) => (
                        <li
                            aria-current={step.current ? "step" : undefined}
                            className="flex items-start gap-2 text-sm"
                            key={step.label}
                        >
                            <span
                                aria-hidden="true"
                                className={`workflow-step-dot ${
                                    step.failed || step.complete || step.current
                                        ? `workflow-step-dot-${step.tone}`
                                        : "workflow-step-dot-upcoming"
                                }`}
                            />
                            <span>
                                {step.label}
                                {step.pending && (
                                    <small className="block text-muted-foreground">
                                        Checking in background…
                                    </small>
                                )}
                                {step.current && (
                                    <small
                                        className={`block workflow-step-current workflow-step-current-${step.tone}`}
                                    >
                                        Current step
                                    </small>
                                )}
                                {step.failed && (
                                    <small className="block text-danger-token">
                                        Needs attention
                                    </small>
                                )}
                                {step.upcoming && (
                                    <small className="block text-muted-foreground">
                                        Upcoming
                                    </small>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>

            </aside>

            <section className="min-w-0">
                <div className="request-processing-top-row">
                    <header className="admin-form-card request-code-card">
                        <span className="section-label">BR CODE ID</span>
                        <h1 className="mt-1 text-2xl font-bold">
                            {request.tracking_number}
                        </h1>
                    </header>

                    {isSubmitted && (
                        <div className="admin-form-card request-decision-card request-action-card">
                            <h2 className="form-section-title">Decision</h2>
                            {rejecting ? (
                                <form
                                    className="flex flex-col gap-3"
                                    onSubmit={rejectRequest}
                                >
                                    <label
                                        className="app-label"
                                        htmlFor="rejection-reason"
                                    >
                                        Rejection reason
                                    </label>
                                    <select
                                        className="app-select"
                                        id="rejection-reason"
                                        onChange={(event) =>
                                            setRejectionReason(event.target.value)
                                        }
                                        required
                                        value={rejectionReason}
                                    >
                                        <option value="">Select a reason</option>
                                        {REJECTION_REASONS.map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason}
                                            </option>
                                        ))}
                                    </select>
                                    {rejectionReason === "Other" && (
                                        <input
                                            className="app-input"
                                            maxLength={2000}
                                            onChange={(event) =>
                                                setRejectionOther(event.target.value)
                                            }
                                            placeholder="Explain the other reason"
                                            required
                                            value={rejectionOther}
                                        />
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            className="app-button app-button-danger"
                                            disabled={busy}
                                            loading={busy}
                                            type="submit"
                                        >
                                            Confirm Rejection
                                        </Button>
                                        <Button
                                            className="app-button app-button-outline-secondary"
                                            disabled={busy}
                                            onClick={() => setRejecting(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="request-decision-actions">
                                    <Button
                                        className="app-button app-button-workflow-approved"
                                        disabled={busy}
                                        loading={busy}
                                        onClick={approveForPickup}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        className="app-button app-button-danger"
                                        disabled={busy}
                                        onClick={() => setRejecting(true)}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {isApproved && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">Approved</h2>
                            <Button
                                className="app-button app-button-workflow-ready"
                                disabled={busy}
                                loading={busy}
                                onClick={() => updateStatus("ready_for_pickup")}
                            >
                                Generate Document &amp; Mark Ready
                            </Button>
                        </div>
                    )}

                    {isReady && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">Ready for Pickup</h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    className="app-button app-button-success"
                                    disabled={busy}
                                    loading={busy}
                                    onClick={() => updateStatus("completed")}
                                >
                                    Completed
                                </Button>
                                {documentPreview && !documentPreview.is_preview && (
                                    <Button
                                        className="app-button app-button-outline-primary"
                                        disabled={busy}
                                        loading={busy}
                                        onClick={printGeneratedDocument}
                                    >
                                        Print Document
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {(isCompleted || isRejected) && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">
                                {isCompleted ? "Completed" : "Rejected"}
                            </h2>
                        </div>
                    )}
                </div>

                {message && (
                    <div className="app-alert app-alert-success mb-4" role="status">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="app-alert app-alert-danger mb-4" role="alert">
                        {error}
                    </div>
                )}

                {documentPreview ? (
                    <div>
                        <DocumentPreview document={documentPreview} />
                        {isReady && documentPreview.is_preview && (
                            <Button
                                className="app-button app-button-primary mt-3 document-preview-toolbar"
                                disabled={busy}
                                loading={busy}
                                onClick={generateLegacyDocument}
                            >
                                Generate Official Document
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="app-alert app-alert-warning" role="status">
                        The document template preview is unavailable.
                    </div>
                )}

            </section>
        </div>
    );
}
