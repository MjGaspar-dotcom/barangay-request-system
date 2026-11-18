import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import RequestWorkflowPanel from "../../components/requests/RequestWorkflowPanel";
import { useToast } from "../../components/ui/toast-context";
import { isInCurrentWorkflow } from "../../utils/requestWorkflow";
import { subscribeToDocumentTemplateUpdates } from "../../utils/documentTemplateUpdates";
import "./request-processing.css";

export default function RequestProcessingPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const backPath = isAdmin ? "/admin/requests" : "/staff/queue";
    const [request, setRequest] = useState(null);
    const [pdfTemplate, setPdfTemplate] = useState(null);
    const [pdfTemplatePreview, setPdfTemplatePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const lastRefreshError = useRef("");
    const { dismissToast, showToast } = useToast();
    const requestToastId = "request-processing-toast";
    const pdfTemplatePreviewUrl =
        pdfTemplatePreview?.template === pdfTemplate
            ? pdfTemplatePreview.url
            : null;
    const showRequestToast = useCallback(
        (message, severity = "info", action = null) => {
            if (!message) {
                dismissToast(requestToastId);
                return;
            }

            const variant = [
                "success",
                "info",
                "warning",
                "error",
                "rejected",
            ].includes(severity)
                ? severity
                : "info";
            const titles = {
                success: "Success",
                info: "Request update",
                warning: "Attention",
                error: "Action failed",
                rejected: "Request rejected",
            };
            showToast({
                id: requestToastId,
                resetTimer: true,
                title: titles[variant],
                description: message,
                variant,
                action,
                duration: 7000,
            });
        },
        [dismissToast, showToast],
    );
    useEffect(
        () => () => dismissToast(requestToastId),
        [dismissToast],
    );
    const notifyRefreshError = useCallback(
        (message) => {
            if (lastRefreshError.current === message) return;
            lastRefreshError.current = message;
            showRequestToast(message, "warning");
        },
        [showRequestToast],
    );
    const loadRequest = useCallback(
        async (initial = false, refreshTemplate = initial) => {
            if (initial) {
                setLoading(true);
                setError("");
                setPdfTemplate(null);
                lastRefreshError.current = "";
            }

            try {
                const response = await api.get(
                    `/barangay-requests/${requestId}`,
                );
                const requestData = response.data.data;
                if (!isInCurrentWorkflow(requestData)) {
                    if (initial) {
                        setError("Request not found.");
                        showRequestToast("Request not found.", "error");
                    } else {
                        notifyRefreshError("Request not found.");
                    }
                    if (initial) setLoading(false);
                    return;
                }
                setRequest(requestData);
                lastRefreshError.current = "";
            } catch (requestError) {
                console.error(requestError);
                let message;
                if (requestError.response?.status === 403) {
                    message = "You are not authorized to process this request.";
                } else if (requestError.response?.status === 404) {
                    message = "Request not found.";
                } else {
                    message = "Failed to load request processing details.";
                }
                if (initial) {
                    setError(message);
                    showRequestToast(message, "error");
                    setLoading(false);
                } else {
                    notifyRefreshError(message);
                }
                return;
            }

            if (!refreshTemplate) return;

            try {
                const previewResponse = await api.get(
                    `/barangay-requests/${requestId}/template-preview`,
                );
                const template = previewResponse.data.data.pdf_template;
                setPdfTemplate(template);
                if (!template) {
                    notifyRefreshError(
                        "No uploaded PDF template is available for this document type. An administrator must upload one before this request can be approved.",
                    );
                } else {
                    lastRefreshError.current = "";
                }
            } catch (previewError) {
                console.error(previewError);
                setPdfTemplate(null);
                notifyRefreshError(
                    previewError.response?.data?.message ||
                        "The document template preview is unavailable.",
                );
            } finally {
                if (initial) setLoading(false);
            }
        },
        [notifyRefreshError, requestId, showRequestToast],
    );

    useEffect(() => {
        let active = true;
        let objectUrl = null;
        const isDocxTemplate =
            typeof pdfTemplate?.filename === "string" &&
            pdfTemplate.filename.toLowerCase().endsWith(".docx");

        if (
            !pdfTemplate ||
            isDocxTemplate ||
            request?.document_template_identifier === "uploaded_pdf_template"
        ) {
            return undefined;
        }

        api.get(
            `/barangay-requests/${requestId}/template-preview/file`,
            { responseType: "blob" },
        )
            .then((response) => {
                objectUrl = URL.createObjectURL(response.data);
                if (active) {
                    setPdfTemplatePreview({
                        template: pdfTemplate,
                        url: objectUrl,
                    });
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            })
            .catch((previewError) => {
                console.error(previewError);
                showRequestToast(
                    previewError.response?.data?.message ||
                        "The document template preview could not be loaded.",
                    "error",
                );
            });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [
        pdfTemplate,
        request?.document_template_identifier,
        requestId,
        showRequestToast,
    ]);

    useEffect(() => {
        Promise.resolve().then(() => loadRequest(true));
    }, [loadRequest]);

    useEffect(() => {
        if (
            !["queued", "processing"].includes(
                request?.document_generation_status,
            )
        ) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            void loadRequest(false);
        }, 2000);
        return () => window.clearInterval(timer);
    }, [loadRequest, request?.document_generation_status]);

    useEffect(
        () =>
            subscribeToDocumentTemplateUpdates(({ documentTypeId }) => {
                const requestDocumentTypeId =
                    request?.document_type_id ??
                    request?.document_type?.document_type_id;
                if (
                    requestDocumentTypeId &&
                    Number(requestDocumentTypeId) !== documentTypeId
                ) {
                    return;
                }
                void loadRequest(false, true);
            }),
        [loadRequest, request?.document_type_id, request?.document_type?.document_type_id],
    );

    const refreshRequest = useCallback(async () => {
        await loadRequest(false);
    }, [loadRequest]);

    if (loading) {
        return (
            <Layout>
                <SkeletonLoader label="Loading request processing" variant="detail" />
            </Layout>
        );
    }

    if (error || !request) {
        return (
            <Layout>
                <div className="page-loading">
                    <Button
                        className="app-button app-button-outline-secondary mt-4"
                        onClick={() => navigate(backPath)}
                        type="button"
                    >
                        Back to Requests
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="admin-dashboard request-processing-page">
                <div className="w-full">
                    <div className="request-processing-toolbar">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                className="app-button app-button-outline-secondary"
                                onClick={() => navigate(backPath)}
                                type="button"
                            >
                                Back to Requests
                            </Button>
                        </div>
                    </div>

                    <RequestWorkflowPanel
                        key={request.request_id}
                        onToast={showRequestToast}
                        pdfTemplate={pdfTemplate}
                        pdfTemplatePreviewUrl={pdfTemplatePreviewUrl}
                        onRefresh={refreshRequest}
                        request={request}
                    />
                </div>
            </div>
        </Layout>
    );
}
