import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import RequestWorkflowPanel from "../../components/requests/RequestWorkflowPanel";

export default function AdminRequestDetails() {
    const { requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let active = true;
        api.get(`/barangay-requests/${requestId}`)
            .then((response) => {
                if (!active) return;
                setRequest(response.data.data);
                setError("");
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
            setError("");
        } catch (requestError) {
            console.error(requestError);
            setActionMessage(
                "The action succeeded, but request details could not be refreshed.",
            );
        }
    }, [requestId]);

    const deleteRequest = async () => {
        setDeleting(true);
        setActionMessage("");
        try {
            await api.delete(`/barangay-requests/${requestId}`);
            navigate("/admin/requests");
        } catch (deleteError) {
            console.error(deleteError);
            setActionMessage(
                deleteError.response?.data?.message ||
                    "Failed to delete this pending request.",
            );
        } finally {
            setDeleting(false);
            setDeleteConfirmation(false);
        }
    };

    if (
        loading ||
        (!error && request?.request_id !== Number(requestId))
    ) {
        return (
            <AdminLayout>
                <SkeletonLoader label="Loading request details" variant="detail" />
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <h3 className="text-danger-token">{error}</h3>
                    <Button
                        className="btn btn-outline-secondary mt-3"
                        onClick={() => navigate("/admin/requests")}
                        type="button"
                    >
                        Back to Manage Requests
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    if (!request) return null;

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "ΓÇö";

    return (
        <AdminLayout>
            <div className="admin-dashboard admin-request-details-page">
                <div className="container-fluid">
                    <header className="dashboard-page-header">
                        <div className="request-details-header-top">
                            <Button
                                className="btn btn-request-details-back"
                                onClick={() => navigate("/admin/requests")}
                                type="button"
                            >
                                <i className="bi bi-arrow-left" aria-hidden="true" />
                                <span>Back to Manage Requests</span>
                            </Button>
                            <StatusBadge status={request.status} />
                        </div>
                        <div className="request-details-heading">
                            <span className="section-label">REQUEST DETAILS</span>
                            <h1>{request.tracking_number}</h1>
                            <p>Registered resident document request</p>
                        </div>
                    </header>

                    {actionMessage && (
                        <div className="alert alert-danger" role="alert">
                            {actionMessage}
                        </div>
                    )}

                    <div className="row g-4">
                        <div className="col-lg-7">
                            <section className="d-flex flex-column gap-3">
                                <div className="admin-form-card detail-card-spaced">
                                    <h2 className="form-section-title">
                                        Request Information
                                    </h2>
                                    <div className="detail-grid">
                                        <div>
                                            <span className="detail-label">
                                                Document Type
                                            </span>
                                            <span className="detail-value">
                                                {request.document_type?.document_name ||
                                                    "Unknown"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">
                                                Current Status
                                            </span>
                                            <span className="detail-value">
                                                <StatusBadge status={request.status} />
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">Purpose</span>
                                            <span className="detail-value">
                                                {request.purpose || "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">
                                                Submitted At
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(request.created_at)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="detail-label">
                                                Last Updated
                                            </span>
                                            <span className="detail-value">
                                                {formatDate(request.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-form-card">
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
                                                <span className="detail-label">
                                                    Username
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.username || "—"}
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
                                                    Address
                                                </span>
                                                <span className="detail-value">
                                                    {request.user.address || "—"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mb-0">
                                            Resident profile information is not
                                            available for this request.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="col-lg-5">
                            <RequestWorkflowPanel
                                onDelete={() => setDeleteConfirmation(true)}
                                onRefresh={refreshRequest}
                                request={request}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                confirmLabel={deleting ? "Deleting..." : "Delete request"}
                isOpen={deleteConfirmation}
                onClose={() => setDeleteConfirmation(false)}
                onConfirm={deleteRequest}
                title="Delete pending request?"
                variant="danger"
            >
                Only pending requests can be deleted. Requests with a decision or
                processing history remain as official transaction records.
            </ConfirmDialog>
        </AdminLayout>
    );
}
