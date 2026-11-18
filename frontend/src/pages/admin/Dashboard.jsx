import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DocumentRequestTrendPreview from "../../components/analytics/DocumentRequestTrendPreview";
import PortalLayout from "../../layouts/PortalLayout";
import { ADMIN_NAV_ITEMS } from "../../layouts/adminNavigation";
import { useAuth } from "../../hooks/useAuth";
import useLiveRefresh from "../../hooks/useLiveRefresh";
import api from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";
import { isInCurrentWorkflow } from "../../utils/requestWorkflow";

const count = (value) =>
    Number.isInteger(Number(value)) ? Number(value).toLocaleString() : "—";

function OverviewCard({ label, value, description, loading }) {
    return (
        <div className="admin-overview-card" aria-busy={loading}>
            <span className="admin-overview-label">{label}</span>
            {loading ? (
                <div
                    className="admin-skeleton admin-overview-value-skeleton"
                    role="status"
                    aria-label={`Loading ${label.toLowerCase()}`}
                />
            ) : (
                <strong>{value}</strong>
            )}
            {loading ? (
                <div
                    className="admin-skeleton admin-overview-description-skeleton"
                    aria-hidden="true"
                />
            ) : (
                <p>{description}</p>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Administrator Landing Page
|--------------------------------------------------------------------------
| This is the main landing page for authenticated administrators.
|
| Administrators have a wider view of the system than staff members.
| They can monitor the overall system and access management areas.
|
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchDashboard = useCallback(async () => {
        const [statsResponse, activityResponse, requestsResponse] =
            await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/recent-activity", {
                    params: { per_page: 5 },
                }),
                api.get("/staff/requests"),
            ]);
        const activityPage = activityResponse.data?.data;
        const requestData = requestsResponse.data?.data;

        if (
            !statsResponse.data?.data ||
            !Array.isArray(activityPage?.data) ||
            !Array.isArray(requestData)
        ) {
            throw new Error("Unexpected dashboard response.");
        }

        return {
            stats: statsResponse.data.data,
            activity: activityPage.data,
            requests: requestData,
        };
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            const data = await fetchDashboard();
            setStats(data.stats);
            setActivity(data.activity);
            setRequests(data.requests);
            setError("");
        } catch (fetchError) {
            console.error(
                "Failed to load administrator dashboard:",
                fetchError
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

    /*
     * Display the administrator's name when available.
     */
    const adminName =
        user?.first_name || user?.firstName || user?.name || "Administrator";
    const recentRequests = requests.filter(isInCurrentWorkflow).slice(0, 5);
    const requesterName = (request) => {
        const applicant = request.user || request.guest_applicant;
        return [
            applicant?.first_name,
            applicant?.middle_name,
            applicant?.last_name,
        ]
            .filter(Boolean)
            .join(" ") || "Unknown requester";
    };
    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
    };

    return (
        <PortalLayout
            portalLabel="ADMINISTRATION"
            sidebarItems={ADMIN_NAV_ITEMS}
        >
            <section className="admin-portal">
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
                <div className="admin-portal-welcome">
                    <div>
                        <span className="portal-eyebrow">
                            ADMINISTRATOR PORTAL
                        </span>

                        <h1>
                            Welcome, <span>{adminName}</span>
                        </h1>

                        <p>
                            Monitor the document request system and manage its
                            users, staff, and services.
                        </p>
                    </div>

                    <div className="admin-system-status">
                        <span
                            className={`admin-system-dot ${error ? "error" : ""
                                }`}
                        ></span>
                        {loading
                            ? "CHECKING SYSTEM"
                            : error
                                ? "DATA UNAVAILABLE"
                                : "SYSTEM ONLINE"}
                    </div>
                </div>

                {/* -------------------------------------------------------
                    System Overview
                ------------------------------------------------------- */}
                <div className="admin-overview-grid">
                    <OverviewCard
                        label="DOCUMENT REQUESTS"
                        value={count(
                            stats?.total_registered_requests ??
                                stats?.total_requests,
                        )}
                        description="Total requests"
                        loading={loading}
                    />
                    <OverviewCard
                        label="USERS"
                        value={count(stats?.total_residents)}
                        description="Registered residents"
                        loading={loading}
                    />
                    <OverviewCard
                        label="STAFF"
                        value={count(stats?.total_staff)}
                        description="Active staff accounts"
                        loading={loading}
                    />
                    <OverviewCard
                        label="DOCUMENT TYPES"
                        value={count(stats?.active_document_types)}
                        description="Available services"
                        loading={loading}
                    />
                    <OverviewCard
                        label="AUDIT LOGS"
                        value={count(stats?.total_audit_logs)}
                        description="Recorded system actions"
                        loading={loading}
                    />
                </div>

                {/* -------------------------------------------------------
                    Manage Requests Preview
                ------------------------------------------------------- */}
                <div className="admin-management-panel admin-request-preview">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-section-label">
                                MANAGE REQUESTS
                            </span>
                            <h2>Recent document requests</h2>
                        </div>
                        <Link
                            to="/admin/requests"
                            className="admin-activity-link"
                        >
                            View all
                        </Link>
                    </div>

                    {error ? (
                        <p className="admin-activity-message">
                            Recent requests are unavailable.
                        </p>
                    ) : loading ? (
                        <div
                            className="admin-request-skeleton-list"
                            role="status"
                            aria-label="Loading recent document requests"
                        >
                            {Array.from({ length: 4 }, (_, index) => (
                                <div
                                    className="admin-request-skeleton-row"
                                    key={index}
                                >
                                    <span className="admin-skeleton" />
                                    <span className="admin-skeleton" />
                                </div>
                            ))}
                        </div>
                    ) : recentRequests.length ? (
                        <div className="admin-request-preview-list">
                            {recentRequests.map((request) => (
                                <div
                                    className="admin-request-preview-row"
                                    key={request.request_id}
                                >
                                    <div className="admin-request-preview-copy">
                                        <strong>{requesterName(request)}</strong>
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
                                    <div className="admin-request-preview-actions">
                                        <StatusBadge
                                            status={request.status}
                                            size="sm"
                                        />
                                        <Link
                                            to={`/admin/requests/${request.request_id}`}
                                            aria-label={`View request ${request.tracking_number || request.request_id}`}
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="admin-empty-state">
                            <div className="admin-empty-icon">
                                <Icon name="inbox" />
                            </div>
                            <h3>No document requests</h3>
                            <p>New requests will appear here.</p>
                        </div>
                    )}
                </div>

                {/* -------------------------------------------------------
                    Analytics / Activity Area
                ------------------------------------------------------- */}
                <div className="admin-bottom-grid">
                    <div className="admin-activity-card">
                        <div className="admin-panel-header">
                            <div>
                                <span className="admin-section-label">
                                    SYSTEM ACTIVITY
                                </span>

                                <h2>Recent Activity</h2>
                            </div>
                            <Link
                                to="/admin/recent-activity"
                                className="admin-activity-link"
                            >
                                View all
                            </Link>
                        </div>

                        {error ? (
                            <p className="admin-activity-message">
                                Recent activity is unavailable.
                            </p>
                        ) : loading ? (
                            <div
                                className="admin-activity-skeleton-list"
                                role="status"
                                aria-label="Loading recent activity"
                            >
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div
                                        className="admin-activity-skeleton-row"
                                        key={index}
                                    >
                                        <span className="admin-skeleton" />
                                        <span className="admin-skeleton" />
                                    </div>
                                ))}
                            </div>
                        ) : activity.length ? (
                            <div className="admin-activity-list">
                                {activity.map((entry, index) => (
                                    <div
                                        className="admin-activity-item"
                                        key={
                                            entry.audit_log_id ??
                                            entry.id ??
                                            `${entry.created_at}-${index}`
                                        }
                                    >
                                        <strong>
                                            {entry.description ||
                                                "System activity"}
                                        </strong>
                                        <span>
                                            {entry.created_at
                                                ? new Date(
                                                    entry.created_at
                                                ).toLocaleString()
                                                : "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="admin-empty-state">
                                <div className="admin-empty-icon">
                                    <Icon name="clock-history" />
                                </div>
                                <h3>No recent activity</h3>
                                <p>System activity will appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className="admin-analytics-card admin-analytics-preview-card">
                        <div className="admin-panel-header">
                            <div>
                                <span className="admin-section-label">
                                    ANALYTICS
                                </span>

                                <h2>System Insights</h2>
                            </div>
                            <Link
                                to="/admin/analytics"
                                className="admin-activity-link"
                            >
                                View trends
                            </Link>
                        </div>

                        <DocumentRequestTrendPreview
                            completedRequests={
                                stats
                                    ? count(stats.completed_requests)
                                    : "—"
                            }
                            submittedRequests={
                                stats
                                    ? count(stats.submitted_requests)
                                    : "—"
                            }
                            dashboardLoading={loading}
                            dashboardError={Boolean(error)}
                        />
                    </div>
                </div>

            </section>
        </PortalLayout>
    );
}

export default Dashboard;
