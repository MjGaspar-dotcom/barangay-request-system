import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
import api from "../../services/api";

const STATUS_GROUPS = [
    { label: "Pending", key: "pending", tone: "pending" },
    { label: "Approved", key: "approved", tone: "approved" },
    { label: "Processing", key: "processing", tone: "processing" },
    { label: "Ready for Pickup", key: "ready for pickup", tone: "ready" },
    { label: "Completed", key: "completed", tone: "completed" },
    { label: "Rejected", key: "rejected", tone: "rejected" },
];

export default function StaffReports() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    const fetchRequests = useCallback(async () => {
        const response = await api.get("/barangay-requests");
        const data = response.data?.data;
        if (!Array.isArray(data)) {
            throw new Error("Unexpected staff requests response.");
        }
        return data;
    }, []);

    useEffect(() => {
        let active = true;

        const loadReportData = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchRequests();
                if (active) setRequests(data);
            } catch (loadError) {
                console.error("Failed to load staff request reports:", loadError);
                if (active) {
                    setError("Unable to load request reports. Please try again.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadReportData();
        return () => {
            active = false;
        };
    }, [fetchRequests, retryKey]);

    const counts = requests.reduce((result, request) => {
        const status = String(request.status || "").toLowerCase();
        result[status] = (result[status] || 0) + 1;
        return result;
    }, {});

    const requesterName = (request) => {
        const requester = request.user || request;
        return (
            [
                requester?.first_name || requester?.guest_first_name,
                requester?.last_name || requester?.guest_last_name,
            ]
                .filter(Boolean)
                .join(" ") || "Unknown requester"
        );
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };

    const handleRetry = () => setRetryKey((current) => current + 1);

    return (
        <StaffLayout>
            <section className="staff-portal staff-reports-page">
                <header className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">STAFF PORTAL</span>
                        <h1>Request Reports</h1>
                        <p>
                            Review status totals and request records available
                            to the staff workspace.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={handleRetry}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="staff-report-stats">
                    <article className="staff-stat-card report-total">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">TOTAL</span>
                            <span className="staff-stat-number">
                                {loading || error ? "—" : requests.length}
                            </span>
                        </div>
                    </article>
                    {STATUS_GROUPS.map((group) => (
                        <article
                            className={`staff-stat-card report-${group.tone}`}
                            key={group.key}
                        >
                            <div className="staff-stat-top">
                                <span className="staff-stat-label">
                                    {group.label}
                                </span>
                                <span className="staff-stat-number">
                                    {loading || error
                                        ? "—"
                                        : counts[group.key] || 0}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>

                <section className="staff-report-records">
                    <div className="staff-work-card">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    REQUEST SUMMARY
                                </span>
                                <h2>Request Records</h2>
                            </div>
                            <span className="staff-work-count">
                                {loading || error ? "—" : requests.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="staff-report-message" role="status">
                                <span
                                    className="spinner-border spinner-border-sm text-success"
                                    aria-hidden="true"
                                />
                                Loading request reports...
                            </div>
                        ) : error ? (
                            <p className="staff-report-message">
                                Report records are unavailable.
                            </p>
                        ) : requests.length === 0 ? (
                            <div className="staff-empty-state">
                                <div className="staff-empty-icon">
                                    <i
                                        className="bi bi-bar-chart-line"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3>No request records yet</h3>
                                <p>
                                    Requests available to staff will appear in
                                    this report.
                                </p>
                            </div>
                        ) : (
                            <DataTable className="staff-reports-table">
                                <thead>
                                    <tr>
                                        <th>Tracking Number</th>
                                        <th>Requester</th>
                                        <th>Document</th>
                                        <th>Submitted</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => {
                                        const requestType =
                                            request.request_type ||
                                            (request.user_id ? "registered" : "guest");
                                        const requestId =
                                            request.request_id ||
                                            request.guest_request_id;
                                        return (
                                            <tr
                                                key={`${requestType}-${requestId}`}
                                            >
                                                <td>
                                                    <strong>
                                                        {request.tracking_number ||
                                                            "—"}
                                                    </strong>
                                                </td>
                                                <td>{requesterName(request)}</td>
                                                <td>
                                                    {request.document_type
                                                        ?.document_name ||
                                                        "Document request"}
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        request.created_at,
                                                    )}
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status={
                                                            request.status ||
                                                            "Unknown"
                                                        }
                                                        size="sm"
                                                    />
                                                </td>
                                                <td>
                                                    <Link
                                                        className="staff-report-link"
                                                        to={`/staff/requests/${requestType}/${requestId}`}
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        )}
                    </div>
                </section>
            </section>
        </StaffLayout>
    );
}
