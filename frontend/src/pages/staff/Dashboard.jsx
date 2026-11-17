import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useLiveRefresh from "../../hooks/useLiveRefresh";
import StaffLayout from "../../layouts/StaffLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import api from "../../services/api";
import { isInCurrentWorkflow } from "../../utils/requestWorkflow";

const count = (value) =>
    Number.isInteger(Number(value)) ? Number(value).toLocaleString() : "—";

function Dashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    /*
     * Display the staff member's name when available.
     * Fall back to "Staff" when the backend does not provide a name.
     */
    const staffName =
        user?.first_name || user?.firstName || user?.name || "Staff";

    const fetchDashboard = useCallback(async () => {
        const [requestsResponse, statsResponse, activityResponse] =
            await Promise.all([
                api.get("/staff/requests"),
                api.get("/staff/dashboard-stats"),
                api.get("/staff/recent-activity", {
                    params: { per_page: 5 },
                }),
            ]);
        const requestData = requestsResponse.data?.data;
        const dashboardStats = statsResponse.data?.data;
        const activityData = activityResponse.data?.data?.data;

        if (
            !Array.isArray(requestData) ||
            !dashboardStats ||
            !Array.isArray(activityData)
        ) {
            throw new Error("Unexpected staff dashboard response.");
        }

        return {
            requests: requestData.filter(isInCurrentWorkflow),
            stats: dashboardStats,
            activity: activityData,
        };
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            const dashboardData = await fetchDashboard();
            setRequests(dashboardData.requests);
            setStats(dashboardData.stats);
            setActivity(dashboardData.activity);
            setError("");
        } catch (fetchError) {
            console.error(
                "Failed to load staff dashboard:",
                fetchError,
            );
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [fetchDashboard]);

    useEffect(() => {
        Promise.resolve().then(loadDashboard);
    }, [loadDashboard, refreshKey]);

    useLiveRefresh(loadDashboard);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRefreshKey((current) => current + 1);
    };

    if (loading) {
        return (
            <StaffLayout>
                <section className="staff-portal staff-dashboard-page">
                    <SkeletonLoader
                        label="Loading staff dashboard"
                        variant="dashboard"
                    />
                </section>
            </StaffLayout>
        );
    }

    const recentRequests = requests.slice(0, 5);
    const recentActivity = activity.slice(0, 3);
    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
    };
    const formatDateTime = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };
    const requesterName = (request) =>
        [request.user?.first_name, request.user?.last_name]
            .filter(Boolean)
            .join(" ") || "Unknown requester";
    const overviewCards = [
        {
            label: "DOCUMENT REQUESTS",
            value: stats?.total_registered_requests,
            description: "Total requests",
        },
        {
            label: "USERS",
            value: stats?.total_residents,
            description: "Registered residents",
        },
        {
            label: "STAFF",
            value: stats?.total_staff,
            description: "Active staff accounts",
        },
        {
            label: "DOCUMENT TYPES",
            value: stats?.active_document_types,
            description: "Available services",
        },
        {
            label: "AUDIT LOGS",
            value: stats?.total_audit_logs,
            description: "Recorded system actions",
        },
    ];
    const workflowSteps = [
        {
            number: "01",
            title: "Request Submitted",
            description: "Resident submits a request for a barangay document.",
        },
        {
            number: "02",
            title: "Approve or Reject",
            description:
                "Review the request and approve it or provide a rejection reason.",
        },
        {
            number: "03",
            title: "Ready for Pickup",
            description:
                "Prepare the approved document and make it ready for collection.",
        },
        {
            number: "04",
            title: "Completed",
            description: "Record the recipient when the document is released.",
        },
    ];

    return (
        <StaffLayout>
            <section className="staff-portal staff-dashboard-page">
                {error && (
                    <div className="app-alert app-alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="app-button app-button-sm app-button-outline-danger ms-2"
                            onClick={handleRetry}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* -------------------------------------------------------
                    Welcome Header
                ------------------------------------------------------- */}
                <div className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">STAFF PORTAL</span>

                        <h1>
                            Welcome, <span>{staffName}</span>
                        </h1>

                        <p>
                            Manage barangay document requests and monitor their
                            processing status.
                        </p>
                    </div>

                    <div className="staff-status-badge">
                        <span className="staff-status-dot"></span>
                        STAFF ACCOUNT
                    </div>
                </div>

                <div className="admin-overview-grid staff-dashboard-overview-grid">
                    {overviewCards.map((card) => (
                        <article
                            className="admin-overview-card"
                            key={card.label}
                        >
                            <span className="admin-overview-label">
                                {card.label}
                            </span>
                            <strong>
                                {error ? "—" : count(card.value)}
                            </strong>
                            <p>{error ? "Data unavailable" : card.description}</p>
                        </article>
                    ))}
                </div>

                <section className="staff-work-card staff-dashboard-workflow-card">
                    <div className="staff-work-header">
                        <div>
                            <span className="staff-section-label">
                                REQUEST WORKFLOW
                            </span>
                            <h2>Four-stage request workflow</h2>
                        </div>
                    </div>
                    <div className="staff-dashboard-workflow">
                        {workflowSteps.map((step) => (
                            <article
                                className="staff-dashboard-workflow-step"
                                key={step.number}
                            >
                                <span className="staff-dashboard-workflow-number">
                                    {step.number}
                                </span>
                                <div>
                                    <strong>{step.title}</strong>
                                    <p>{step.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="staff-dashboard-preview-grid">
                    <article className="staff-work-card staff-dashboard-requests-preview">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    MANAGE REQUESTS
                                </span>
                                <h2>Recent requests</h2>
                            </div>
                            <Link
                                className="staff-dashboard-preview-link"
                                to="/staff/requests"
                            >
                                View all
                            </Link>
                        </div>

                        {error ? (
                            <p className="staff-dashboard-preview-message">
                                Recent requests are unavailable.
                            </p>
                        ) : recentRequests.length === 0 ? (
                            <p className="staff-dashboard-preview-message">
                                New requests will appear here.
                            </p>
                        ) : (
                            <div className="staff-dashboard-request-list">
                                {recentRequests.map((request) => (
                                    <div
                                        className="staff-dashboard-request-row"
                                        key={request.request_id}
                                    >
                                        <div className="staff-dashboard-request-copy">
                                            <strong>
                                                {requesterName(request)}
                                            </strong>
                                            <span>
                                                {request.document_type
                                                    ?.document_name ||
                                                    "Unspecified document"}
                                                {" · "}
                                                {request.tracking_number ||
                                                    `Request #${request.request_id}`}
                                            </span>
                                            <time dateTime={request.created_at}>
                                                {formatDate(request.created_at)}
                                            </time>
                                        </div>
                                        <div className="staff-dashboard-request-actions">
                                            <StatusBadge
                                                status={request.status}
                                                size="sm"
                                            />
                                            <Link
                                                to={`/staff/requests/${request.request_id}`}
                                                aria-label={`View request ${request.tracking_number || request.request_id}`}
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="staff-work-card staff-dashboard-activity-preview">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    REQUEST ACTIVITY
                                </span>
                                <h2>Recent activity</h2>
                            </div>
                            <Link
                                className="staff-dashboard-preview-link"
                                to="/staff/recent-activity"
                            >
                                View all
                            </Link>
                        </div>

                        {error ? (
                            <p className="staff-dashboard-preview-message">
                                Recent activity is unavailable.
                            </p>
                        ) : recentActivity.length === 0 ? (
                            <p className="staff-dashboard-preview-message">
                                Request activity will appear here.
                            </p>
                        ) : (
                            <div className="staff-dashboard-activity-list">
                                {recentActivity.map((entry, index) => (
                                    <div
                                        className="staff-dashboard-activity-row"
                                        key={
                                            entry.audit_log_id ??
                                            entry.id ??
                                            `${entry.created_at}-${index}`
                                        }
                                    >
                                        <div>
                                            <strong>
                                                {entry.description ||
                                                    "System activity"}
                                            </strong>
                                            <time dateTime={entry.created_at}>
                                                {formatDateTime(entry.created_at)}
                                            </time>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                </div>

            </section>
        </StaffLayout>
    );
}

export default Dashboard;
