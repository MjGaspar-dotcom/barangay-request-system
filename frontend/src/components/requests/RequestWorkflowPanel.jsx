import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import PdfDocumentCanvas from "../documents/PdfDocumentCanvas";
import SkeletonLoader from "../ui/SkeletonLoader";
import api from "../../services/api";
import { canonicalRequestStatus } from "../../utils/requestWorkflow";

const REJECTION_REASONS = [
    "Incomplete Requirements",
    "Invalid Information",
    "Unverified Residency",
    "Duplicate Request",
    "Requirements Not Met",
    "Other",
];
const PDF_GENERATION_ERROR =
    "PDF generation failed. Check the uploaded template and its field mappings, then retry. If it still fails, check the Laravel and PDF worker logs.";
const PDF_QUEUE_ERROR =
    "PDF generation could not be queued. Check that the Laravel queue worker is running, then retry.";
const LEGACY_PDF_ERRORS = new Map([
    [
        "The official PDF could not be generated. Retry generation or check the uploaded template.",
        PDF_GENERATION_ERROR,
    ],
    [
        "The official PDF could not be queued. Retry generation or check the uploaded template.",
        PDF_QUEUE_ERROR,
    ],
]);

export default function RequestWorkflowPanel({
    request,
    pdfTemplate,
    pdfTemplatePreviewUrl,
    onRefresh,
    onToast,
}) {
    const [busy, setBusy] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionOther, setRejectionOther] = useState("");
    const [pdfPreview, setPdfPreview] = useState(null);
    const [selectedGeneratedDocumentId, setSelectedGeneratedDocumentId] =
        useState(null);
    const [lastPrintedDocument, setLastPrintedDocument] = useState(null);
    const [pdfVersionsError, setPdfVersionsError] = useState("");
    const [automaticGeneration, setAutomaticGeneration] = useState(null);
    const previousGenerationStatus = useRef(
        {
            requestId: request.request_id,
            status: request.document_generation_status,
        },
    );
    const hasPdfDocument =
        request.document_template_identifier === "uploaded_pdf_template";
    const currentPdfPreview =
        hasPdfDocument &&
        pdfPreview?.requestId === request.request_id &&
        String(pdfPreview?.generatedDocumentId) ===
            String(selectedGeneratedDocumentId)
            ? pdfPreview
            : null;
    const pdfPreviewUrl = currentPdfPreview?.url || null;
    const pdfPreviewLoading = Boolean(
        hasPdfDocument && !currentPdfPreview && !pdfVersionsError,
    );
    const pdfPreviewError = currentPdfPreview?.error || "";

    useEffect(() => {
        let active = true;
        if (!hasPdfDocument) {
            return undefined;
        }

        api.get(
            `/barangay-requests/${request.request_id}/generated-documents`,
        )
            .then((response) => {
                if (!active) return;
                const versions = response.data.data.versions;
                setSelectedGeneratedDocumentId(versions[0]?.generated_document_id ?? null);
                setPdfVersionsError(
                    versions.length
                        ? ""
                        : "No generated PDF versions are recorded for this request.",
                );
            })
            .catch((historyError) => {
                console.error(historyError);
                if (active) {
                    setPdfVersionsError(
                        historyError.response?.data?.message ||
                            "Generated PDF history could not be loaded.",
                    );
                }
            });

        return () => {
            active = false;
        };
    }, [
        hasPdfDocument,
        request.request_id,
        request.document_generated_at,
    ]);

    useEffect(() => {
        let active = true;
        let objectUrl = null;

        if (!hasPdfDocument || !selectedGeneratedDocumentId) {
            return undefined;
        }

        api.get(
            `/barangay-requests/${request.request_id}/generated-documents/${selectedGeneratedDocumentId}/file`,
            { responseType: "blob" },
        )
            .then((response) => {
                objectUrl = URL.createObjectURL(response.data);
                if (active) {
                    setPdfPreview({
                        requestId: request.request_id,
                        generatedDocumentId: selectedGeneratedDocumentId,
                        url: objectUrl,
                        error: "",
                    });
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            })
            .catch((previewError) => {
                console.error(previewError);
                if (active) {
                    setPdfPreview({
                        requestId: request.request_id,
                        generatedDocumentId: selectedGeneratedDocumentId,
                        url: null,
                        error:
                            previewError.response?.data?.message ||
                            "The generated PDF preview could not be loaded.",
                    });
                }
            });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [
        hasPdfDocument,
        request.request_id,
        selectedGeneratedDocumentId,
    ]);

    const status = canonicalRequestStatus(request.status);
    const isSubmitted = status === "request_submitted";
    const isApproved = status === "approved";
    const isReady = status === "ready_for_pickup";
    const isCompleted = status === "completed";
    const isRejected = status === "rejected";
    const hasPrintedSelectedDocument = Boolean(
        selectedGeneratedDocumentId !== null &&
            ((lastPrintedDocument?.requestId === request.request_id &&
                String(lastPrintedDocument.generatedDocumentId) ===
                    String(selectedGeneratedDocumentId)) ||
                request.history?.some(
                    (event) =>
                        ["document_printed", "document_reprinted"].includes(
                            event.action,
                        ) &&
                        String(event.new_values?.generated_document_id) ===
                            String(selectedGeneratedDocumentId),
                )),
    );
    const residentCanGeneratePdf =
        request.user?.verification_status === "verified" &&
        Boolean(request.user?.valid_id_front_url);
    const requestHasLatestTemplate =
        pdfTemplate &&
        String(request.document_template_version) ===
            String(pdfTemplate.version_number);
    const needsAutomaticPdf =
        Boolean(pdfTemplate?.mapping_count) &&
        (!hasPdfDocument ||
            (status !== "completed" && !requestHasLatestTemplate)) &&
        [
            "request_submitted",
            "approved",
            "ready_for_pickup",
            "completed",
        ].includes(status);
    const requestGenerationPending = ["queued", "processing"].includes(
        request.document_generation_status,
    );
    const localGenerationPending =
        automaticGeneration?.requestId === request.request_id &&
        ["pending", "queued"].includes(automaticGeneration.status);
    const automaticPdfPending =
        needsAutomaticPdf && (requestGenerationPending || localGenerationPending);
    const automaticPdfFailed =
        needsAutomaticPdf &&
        ((automaticGeneration?.requestId === request.request_id &&
            automaticGeneration.status === "failed") ||
            (request.document_generation_status === "failed" &&
                !localGenerationPending));
    const queuedPdfError =
        automaticGeneration?.requestId === request.request_id &&
        automaticGeneration.status === "failed"
            ? automaticGeneration.error
            : "";
    const storedPdfError =
        LEGACY_PDF_ERRORS.get(request.document_generation_error) ||
        request.document_generation_error;
    const pdfFailureMessage = !residentCanGeneratePdf
        ? "The resident needs current verification and an ID image before PDF generation can continue. Update the resident's verification, then retry."
        : queuedPdfError ||
          storedPdfError ||
          automaticGeneration?.error ||
          PDF_GENERATION_ERROR;

    const queuePdfGeneration = useCallback(async () => {
        onToast(null);
        setAutomaticGeneration({
            requestId: request.request_id,
            status: "pending",
        });

        try {
            await api.post(
                `/barangay-requests/${request.request_id}/generated-document/generate`,
                { regenerate: false },
            );
            setAutomaticGeneration({
                requestId: request.request_id,
                status: "queued",
            });
            await onRefresh();
            setAutomaticGeneration(null);
        } catch (generationError) {
            console.error(generationError);
            setAutomaticGeneration({
                requestId: request.request_id,
                status: "failed",
                error:
                    generationError.response?.data?.message ||
                    PDF_QUEUE_ERROR,
            });
        }
    }, [onRefresh, onToast, request.request_id]);

    useEffect(() => {
        if (automaticPdfPending) {
            onToast(
                "The official PDF is being prepared in the background.",
                "info",
            );
        }
    }, [automaticPdfPending, onToast]);

    useEffect(() => {
        if (automaticPdfFailed) {
            onToast(
                pdfFailureMessage,
                "error",
                residentCanGeneratePdf
                    ? {
                          label: "Retry PDF generation",
                          onClick: () => void queuePdfGeneration(),
                      }
                    : null,
            );
        }
    }, [
        automaticPdfFailed,
        onToast,
        pdfFailureMessage,
        queuePdfGeneration,
        residentCanGeneratePdf,
    ]);

    useEffect(() => {
        if (pdfPreviewError) onToast(pdfPreviewError, "error");
    }, [onToast, pdfPreviewError]);

    useEffect(() => {
        if (hasPdfDocument && pdfVersionsError) {
            onToast(pdfVersionsError, "error");
        }
    }, [hasPdfDocument, onToast, pdfVersionsError]);

    useEffect(() => {
        const previous = previousGenerationStatus.current;
        if (
            previous.requestId === request.request_id &&
            previous.status !== "completed" &&
            request.document_generation_status === "completed"
        ) {
            onToast("Official PDF generation completed successfully.", "success");
        }
        previousGenerationStatus.current =
            {
                requestId: request.request_id,
                status: request.document_generation_status,
            };
    }, [onToast, request.document_generation_status, request.request_id]);

    useEffect(() => {
        if (
            !needsAutomaticPdf ||
            requestGenerationPending ||
            request.document_generation_status === "failed" ||
            (automaticGeneration?.requestId === request.request_id &&
                request.document_generation_status !== "completed" &&
                ["pending", "queued"].includes(automaticGeneration.status))
        ) {
            return;
        }

        void Promise.resolve().then(queuePdfGeneration);
    }, [
        automaticGeneration?.requestId,
        automaticGeneration?.status,
        needsAutomaticPdf,
        queuePdfGeneration,
        requestGenerationPending,
        request.document_generation_status,
        request.request_id,
    ]);

    const runAction = async (action, successMessage) => {
        setBusy(true);
        onToast(null);
        try {
            await action();
            onToast(successMessage, "success");
            await onRefresh();
            return true;
        } catch (actionError) {
            console.error(actionError);
            onToast(
                actionError.response?.data?.message ||
                    "The request action could not be completed.",
                "error",
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
        onToast(null);
        try {
            await api.post(
                `/barangay-requests/${request.request_id}/approve-and-prepare`,
                {},
            );
            onToast("Request approved and ready for pickup.", "success");
            await onRefresh();
        } catch (approvalError) {
            console.error(approvalError);
            onToast(
                approvalError.response?.data?.message ||
                    "The document could not be approved and prepared.",
                "error",
            );
        } finally {
            setBusy(false);
        }
    };

    const printGeneratedDocument = async () => {
        const printWindow = pdfPreviewUrl
            ? window.open("about:blank", "_blank")
            : null;
        if (pdfPreviewUrl && !printWindow) {
            onToast("Allow pop-ups to open and print the generated PDF.", "warning");
            return;
        }
        setBusy(true);
        onToast(null);
        try {
            const response = await api.post(
                `/barangay-requests/${request.request_id}/generated-document/print`,
                { generated_document_id: selectedGeneratedDocumentId },
            );
            setLastPrintedDocument({
                requestId: request.request_id,
                generatedDocumentId: selectedGeneratedDocumentId,
            });
            onToast(
                response.data.data.action === "document_reprinted"
                    ? "Reprint activity recorded."
                    : "Print activity recorded.",
                "success",
            );
            if (printWindow) {
                printWindow.addEventListener(
                    "load",
                    () => {
                        printWindow.focus();
                        printWindow.print();
                    },
                    { once: true },
                );
                printWindow.location.href = pdfPreviewUrl;
            } else {
                window.requestAnimationFrame(() => window.print());
            }
        } catch (printError) {
            console.error(printError);
            printWindow?.close();
            onToast(
                printError.response?.data?.message ||
                    "The document could not be sent to print.",
                "error",
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
            label: isRejected
                ? "Rejected"
                : isApproved
                  ? "Preparing document"
                  : "Request submitted",
            complete: isReady || isCompleted,
            current: isSubmitted || isApproved,
            failed: isRejected,
            tone: isRejected
                ? "rejected"
                : isReady || isCompleted
                  ? "ready-for-pickup"
                  : "request-submitted",
        },
        {
            label: "Ready for pickup",
            complete: isReady || isCompleted,
            current: isReady,
            upcoming: isSubmitted || isApproved || isRejected,
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
                                        disabled={
                                            busy ||
                                            automaticPdfPending ||
                                            automaticPdfFailed ||
                                            !pdfTemplate ||
                                            !pdfTemplate.mapping_count ||
                                            !hasPdfDocument
                                        }
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
                            <h2 className="form-section-title">
                                Preparing Document
                            </h2>
                            <div className="request-pdf-generation-actions">
                                <p className="request-pdf-generation-guidance">
                                    This request will move to Ready for Pickup after its official PDF is generated successfully.
                                </p>
                                <Button
                                    className="app-button app-button-workflow-ready"
                                    disabled={
                                        busy ||
                                        automaticPdfPending ||
                                        automaticPdfFailed ||
                                        !pdfTemplate ||
                                        !pdfTemplate.mapping_count ||
                                        !hasPdfDocument
                                    }
                                    loading={busy}
                                    onClick={() =>
                                        updateStatus("ready_for_pickup")
                                    }
                                >
                                    Mark Ready for Pickup
                                </Button>
                            </div>
                        </div>
                    )}

                    {isReady && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">Ready for Pickup</h2>
                            <div className="flex flex-wrap gap-2">
                                {hasPdfDocument && (
                                    <Button
                                        className="app-button app-button-outline-primary"
                                        disabled={
                                            busy ||
                                            automaticPdfPending ||
                                            !pdfPreviewUrl
                                        }
                                        loading={busy}
                                        onClick={printGeneratedDocument}
                                    >
                                        Print Document
                                    </Button>
                                )}
                                {hasPrintedSelectedDocument && (
                                    <Button
                                        className="app-button app-button-success"
                                        disabled={
                                            busy ||
                                            automaticPdfPending ||
                                            !hasPdfDocument ||
                                            !pdfPreviewUrl
                                        }
                                        loading={busy}
                                        onClick={() => updateStatus("completed")}
                                    >
                                        Complete
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">
                                Completed
                            </h2>
                            {hasPdfDocument && (
                                <Button
                                    className="app-button app-button-outline-primary"
                                    disabled={
                                        busy ||
                                        automaticPdfPending ||
                                        !pdfPreviewUrl
                                    }
                                    loading={busy}
                                    onClick={printGeneratedDocument}
                                >
                                    Print Document
                                </Button>
                            )}
                        </div>
                    )}
                    {isRejected && (
                        <div className="admin-form-card request-action-card">
                            <h2 className="form-section-title">Rejected</h2>
                        </div>
                    )}
                </div>

                {pdfPreviewUrl ? (
                    <>
                        <PdfDocumentCanvas
                            key={pdfPreviewUrl}
                            source={pdfPreviewUrl}
                        />
                    </>
                ) : pdfTemplate ? (
                    pdfTemplatePreviewUrl ? (
                        <PdfDocumentCanvas
                            key={pdfTemplatePreviewUrl}
                            source={pdfTemplatePreviewUrl}
                        />
                    ) : (
                        <SkeletonLoader
                            label="Loading document preview"
                            variant="detail"
                        />
                    )
                ) : pdfPreviewLoading ? (
                    <SkeletonLoader
                        label="Loading document preview"
                        variant="detail"
                    />
                ) : (
                    <div
                        className="request-pdf-preview-placeholder"
                        aria-hidden="true"
                    />
                )}

            </section>
        </div>
    );
}
