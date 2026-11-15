import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import RequestWorkflowPanel from "../../components/requests/RequestWorkflowPanel";
import { isInCurrentWorkflow } from "../../utils/requestWorkflow";
import "./request-processing.css";

export default function RequestProcessingPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const backPath = isAdmin ? "/admin/requests" : "/staff/queue";
    const [request, setRequest] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [pdfTemplate, setPdfTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshError, setRefreshError] = useState("");

    const loadRequest = useCallback(
        async (initial = false) => {
            if (initial) {
                setLoading(true);
                setError("");
                setDocumentPreview(null);
                setPdfTemplate(null);
            }
            setRefreshError("");

            try {
                const response = await api.get(
                    `/barangay-requests/${requestId}`,
                );
                const requestData = response.data.data;
                if (!isInCurrentWorkflow(requestData)) {
                    if (initial) setError("Request not found.");
                    else setRefreshError("Request not found.");
                    if (initial) setLoading(false);
                    return;
                }
                setRequest(requestData);
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
                    setLoading(false);
                } else {
                    setRefreshError(message);
                }
                return;
            }

            try {
                const previewResponse = await api.get(
                    `/barangay-requests/${requestId}/template-preview`,
                );
                setDocumentPreview(previewResponse.data.data.document);
                setPdfTemplate(previewResponse.data.data.pdf_template);
            } catch (previewError) {
                console.error(previewError);
                setDocumentPreview(null);
                setPdfTemplate(null);
                setRefreshError(
                    previewError.response?.data?.message ||
                        "The document template preview is unavailable.",
                );
            } finally {
                if (initial) setLoading(false);
            }
        },
        [requestId],
    );

    useEffect(() => {
        Promise.resolve().then(() => loadRequest(true));
    }, [loadRequest]);

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
                    <h3 className="text-danger-token">
                        {error || "Request not found."}
                    </h3>
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
                        {refreshError && (
                            <div
                                className="app-alert app-alert-warning mb-3"
                                role="status"
                            >
                                {refreshError}
                            </div>
                        )}
                    </div>

                    <RequestWorkflowPanel
                        documentPreview={documentPreview}
                        pdfTemplate={pdfTemplate}
                        onRefresh={refreshRequest}
                        request={request}
                    />
                </div>
            </div>
        </Layout>
    );
}
