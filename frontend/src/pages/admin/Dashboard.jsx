import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import PortalLayout from "../../layouts/PortalLayout";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const navigationItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: "bi-speedometer2" },
    { label: "Manage Users", to: "/admin/users", icon: "bi-people" },
    { label: "Manage Staff", to: "/admin/staff", icon: "bi-person-badge" },
    { label: "Manage Requests", to: "/admin/requests", icon: "bi-clipboard-check" },
    { label: "Document Types", to: "/admin/document-types", icon: "bi-file-earmark-text" },
    { label: "Recent Activity", to: "/admin/recent-activity", icon: "bi-activity" },
];

const count = (value) =>
    Number.isInteger(Number(value)) ? Number(value).toLocaleString() : "ΓÇö";

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchDashboard = useCallback(async () => {
        const [statsResponse, activityResponse] = await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/recent-activity", {
                params: { per_page: 5 },
            }),
        ]);
        const activityPage = activityResponse.data?.data;

        if (
            !statsResponse.data?.data ||
            !Array.isArray(activityPage?.data)
        ) {
            throw new Error("Unexpected dashboard response.");
        }

        return {
            stats: statsResponse.data.data,
            activity: activityPage.data,
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadDashboard = async () => {
            try {
                const data = await fetchDashboard();
                if (active) {
                    setStats(data.stats);
                    setActivity(data.activity);
                }
            } catch (fetchError) {
                console.error(
                    "Failed to load administrator dashboard:",
                    fetchError
                );
                if (active) {
                    setError(
                        "Failed to load dashboard data. Please try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            active = false;
        };
    }, [fetchDashboard, refreshKey]);

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

    return (
        <PortalLayout
            portalLabel="ADMINISTRATION"
            sidebarItems={navigationItems}
        >
            <section className="admin-portal">
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
                            className={`admin-system-dot ${
                                error ? "error" : ""
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
                    <div className="admin-overview-card">
                        <span className="admin-overview-label">
                            DOCUMENT REQUESTS
                        </span>

                        <strong>
                            {loading || error || !stats
                                ? "ΓÇö"
                                : count(
                                      Number(stats.total_registered_requests) +
                                          Number(stats.total_guest_requests)
                                  )}
                        </strong>

                        <p>Total requests</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">USERS</span>

                        <strong>
                            {loading || error || !stats
                                ? "ΓÇö"
                                : count(stats.total_residents)}
                        </strong>

                        <p>Registered residents</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">STAFF</span>

                        <strong>
                            {loading || error || !stats
                                ? "ΓÇö"
                                : count(stats.total_staff)}
                        </strong>

                        <p>Active staff accounts</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">
                            DOCUMENT TYPES
                        </span>

                        <strong>
                            {loading || error || !stats
                                ? "ΓÇö"
                                : count(stats.active_document_types)}
                        </strong>

                        <p>Available services</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">
                            AUDIT LOGS
                        </span>

                        <strong>
                            {loading || error || !stats
                                ? "ΓÇö"
                                : count(stats.total_audit_logs)}
                        </strong>

                        <p>Recorded system actions</p>
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Management Areas
                ------------------------------------------------------- */}
                <div className="admin-management-panel">
                    <div className="admin-panel-header">
                        <div>
                            <span className="admin-section-label">
                                SYSTEM MANAGEMENT
                            </span>

                            <h2>Administration</h2>
                        </div>
                    </div>

                    <div className="admin-management-grid">
                        {/* Users */}
                        <Link
                            to="/admin/users"
                            className="admin-management-item"
                        >
                            <div className="admin-management-icon">U</div>

                            <div className="admin-management-content">
                                <strong>User Management</strong>

                                <span>
                                    Manage resident accounts and user
                                    information.
                                </span>
                            </div>

                            <span className="admin-management-arrow">ΓåÆ</span>
                        </Link>

                        {/* Staff */}
                        <Link
                            to="/admin/staff"
                            className="admin-management-item"
                        >
                            <div className="admin-management-icon">S</div>

                            <div className="admin-management-content">
                                <strong>Staff Management</strong>

                                <span>Manage staff accounts and access.</span>
                            </div>

                            <span className="admin-management-arrow">ΓåÆ</span>
                        </Link>

                        {/* Requests */}
                        <Link
                            to="/admin/requests"
                            className="admin-management-item"
                        >
                            <div className="admin-management-icon">R</div>

                            <div className="admin-management-content">
                                <strong>Document Requests</strong>

                                <span>
                                    Review and monitor document requests.
                                </span>
                            </div>

                            <span className="admin-management-arrow">ΓåÆ</span>
                        </Link>

                        {/* Document Types */}
                        <Link
                            to="/admin/document-types"
                            className="admin-management-item"
                        >
                            <div className="admin-management-icon">D</div>

                            <div className="admin-management-content">
                                <strong>Document Types</strong>

                                <span>
                                    Manage available barangay document services.
                                </span>
                            </div>

                            <span className="admin-management-arrow">ΓåÆ</span>
                        </Link>
                    </div>
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
                            <p className="admin-activity-message">
                                Loading recent activity...
                            </p>
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
                                                : "ΓÇö"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="admin-empty-state">
                                <div className="admin-empty-icon">Γëí</div>
                                <h3>No recent activity</h3>
                                <p>System activity will appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className="admin-analytics-card">
                        <div className="admin-panel-header">
                            <div>
                                <span className="admin-section-label">
                                    ANALYTICS
                                </span>

                                <h2>System Insights</h2>
                            </div>
                        </div>

                        <div className="admin-analytics-content">
                            <div className="admin-analytics-value">
                                {loading || error || !stats
                                    ? "ΓÇö"
                                    : count(
                                          Number(stats.completed_requests) +
                                              Number(stats.guest_completed)
                                      )}
                            </div>

                            <p>
                                Total document requests completed across the
                                system.
                            </p>

                            <span className="admin-analytics-note">
                                {loading || error || !stats
                                    ? "LOADING"
                                    : `${count(
                                          Number(stats.pending_requests) +
                                              Number(stats.guest_pending)
                                      )} REQUESTS PENDING`}
                            </span>
                        </div>
                    </div>
                </div>

                <NotificationCenter />
            </section>
        </PortalLayout>
    );
}

export default Dashboard;
