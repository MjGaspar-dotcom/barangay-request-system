import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import StaffLayout from "../../layouts/StaffLayout";
import RequestWorkflowPanel from "../../components/requests/RequestWorkflowPanel";

export default function StaffRequestDetails() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshError, setRefreshError] = useState("");

    useEffect(() => {
        let active = true;
        if (!/^[1-9]\d*$/.test(requestId || "")) {
            setError("Request not found.");
            setLoading(false);
            return () => {
                active = false;
            };
        }

        api.get(`/barangay-requests/${requestId}`)
            .then((response) => {
                if (!active) return;
                setRequest(response.data.data);
                setError("");
                setRefreshError("");
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

    const refreshRequest = useCallback(async () => {
        try {
            const response = await api.get(
                `/barangay-requests/${requestId}`,
            );
            setRequest(response.data.data);
            setRefreshError("");
        } catch (requestError) {
            console.error(requestError);
            setRefreshError(
                "The action succeeded, but the latest request details could not be refreshed.",
            );
        }
    }, [requestId]);

    if (
        loading ||
        (!error && request?.request_id !== Number(requestId))
    ) {
        return (
            <StaffLayout>
                <SkeletonLoader label="Loading request details" variant="detail" />
            </StaffLayout>
        );
    }

    if (error) {
        return (
            <StaffLayout>
                <div className="app-alert app-alert-danger detail-error-state" role="alert">
                    <p>{error}</p>
                    <Button
                        className="app-button app-button-outline-secondary"
                        onClick={() => navigate("/staff/queue")}
                        type="button"
                    >
                        Back to Request Queue
                    </Button>
                </div>
            </StaffLayout>
        );
    }

    if (!request) return null;

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };

    return (
        <StaffLayout>
            <main className="staff-request-details-page admin-dashboard">
                <div className="staff-request-details-content">
                    <header className="dashboard-page-header staff-request-header">
                        <div className="staff-request-header-top">
                            <Button
                                className="app-button app-button-staff-request-back"
                                onClick={() => navigate("/staff/queue")}
                                type="button"
                            >
                                <Icon name="arrow-left" />
                                Back to Request Queue
                            </Button>
                            <StatusBadge status={request.status} />
                        </div>
                        <div className="staff-request-header-copy">
                            <span className="section-label">REQUEST DETAILS</span>
                            <h1>{request.tracking_number || "Request Details"}</h1>
                            <p>Registered resident document request</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {refreshError && (
                            <div className="col-span-full">
                                <div className="app-alert app-alert-warning" role="status">
                                    {refreshError}
                                </div>
                            </div>
                        )}
                        <div className="lg:col-span-6">
                            <section className="flex flex-col gap-4">
                                <div className="admin-form-card staff-detail-card">
                                    <h2 className="form-section-title">
                                        Request Information
                                    </h2>
                                    <div className="detail-grid">
                                        <div>
                                            <span className="detail-label">
                                                Tracking Number
                                            </span>
                                            <span className="detail-value">
                                                {request.tracking_number || "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">
                                                Document
                                            </span>
                                            <span className="detail-value">
                                                {request.document_type?.document_name ||
                                                    "Unknown"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">Status</span>
                                            <span className="detail-value">
                                                <StatusBadge status={request.status} />
                                            </span>
                                        </div>
                                        <div className="detail-grid-full-row">
                                            <span className="detail-label">
                                                Purpose
                                            </span>
                                            <span className="detail-value">
                                                {request.purpose || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-form-card staff-detail-card">
                                    <h2 className="form-section-title">
                                        Requester Details
                                    </h2>
                                    {request.user ? (
                                        <div className="detail-grid">
                                            <div>
                                                <span className="detail-label">Name</span>
                                                <span className="detail-value">
                                                    {request.user.first_name}{" "}
                                                    {request.user.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">Email</span>
                                                <span className="detail-value">
                                                    {request.user.email || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Contact
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.contact_number || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="detail-label">
                                                    Submitted
                                                </span>
                                                <span className="detail-value">
                                                    {formatDate(request.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mb-0">
                                            Resident profile information is
                                            unavailable.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-6">
                            <RequestWorkflowPanel
                                onRefresh={() =>
                                    refreshRequest()
                                }
                                request={request}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </StaffLayout>
    );
}
