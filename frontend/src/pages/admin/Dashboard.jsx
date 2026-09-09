import { Link } from "react-router-dom";
import PortalLayout from "../../layouts/PortalLayout";
import { useAuth } from "../../hooks/useAuth";

/*
|--------------------------------------------------------------------------
| Administrator Landing Page
|--------------------------------------------------------------------------
| This is the main landing page for authenticated administrators.
|
| Administrators have a wider view of the system than staff members.
| They can monitor the overall system and access management areas.
|
| The statistics below are placeholders until the Laravel dashboard
| API is connected.
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();

    /*
     * Display the administrator's name when available.
     */
    const adminName =
        user?.first_name || user?.firstName || user?.name || "Administrator";

    return (
        <PortalLayout portalLabel="ADMINISTRATION">
            <section className="admin-portal">
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
                        <span className="admin-system-dot"></span>
                        SYSTEM ONLINE
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

                        <strong>0</strong>

                        <p>Total requests</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">USERS</span>

                        <strong>0</strong>

                        <p>Registered residents</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">STAFF</span>

                        <strong>0</strong>

                        <p>Active staff accounts</p>
                    </div>

                    <div className="admin-overview-card">
                        <span className="admin-overview-label">
                            DOCUMENT TYPES
                        </span>

                        <strong>0</strong>

                        <p>Available services</p>
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

                            <span className="admin-management-arrow">→</span>
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

                            <span className="admin-management-arrow">→</span>
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

                            <span className="admin-management-arrow">→</span>
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

                            <span className="admin-management-arrow">→</span>
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
                        </div>

                        <div className="admin-empty-state">
                            <div className="admin-empty-icon">≡</div>

                            <h3>No recent activity</h3>

                            <p>
                                System activity will appear here when users and
                                staff begin using the platform.
                            </p>
                        </div>
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
                            <div className="admin-analytics-value">—</div>

                            <p>
                                Analytics will be available once sufficient
                                request data has been collected.
                            </p>

                            <span className="admin-analytics-note">
                                DATA SCIENCE MODULE
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </PortalLayout>
    );
}

export default Dashboard;
