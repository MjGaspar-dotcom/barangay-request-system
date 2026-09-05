import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, activityResponse] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/recent-activity?per_page=8"),
                ]);

                setStats(statsResponse.data.data);
                setActivity(
                    activityResponse.data.data?.data ||
                    activityResponse.data.data ||
                    []
                );
            } catch (err) {
                console.error(err);
                setError("Failed to load admin statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading admin dashboard...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    const statistics = [
        {
            label: "Total Residents",
            value: stats?.total_residents ?? 0,
            description: "Registered users on the platform",
            icon: "👥",
        },
        {
            label: "Total Staff",
            value: stats?.total_staff ?? 0,
            description: "Active document processors",
            icon: "🧑‍💼",
        },
        {
            label: "Pending Verifications",
            value: stats?.pending_verifications ?? 0,
            description: "Resident accounts awaiting review",
            icon: "⏳",
        },
        {
            label: "Pending Requests",
            value:
                (stats?.pending_requests ?? 0) +
                (stats?.guest_pending ?? 0),
            description: "Requests awaiting processing",
            icon: "🕐",
        },
        {
            label: "Completed Requests",
            value:
                (stats?.completed_requests ?? 0) +
                (stats?.guest_completed ?? 0),
            description: "Successfully processed",
            icon: "✓",
        },
        {
            label: "Document Types",
            value: stats?.document_types ?? 0,
            description: "Available document services",
            icon: "📄",
        },
    ];

    const managementCards = [
        {
            title: "Manage Users",
            description:
                "View resident accounts, update verification status, and remove accounts when necessary.",
            icon: "👥",
            action: "Manage Users",
            path: "/admin/users",
        },
        {
            title: "Manage Staff",
            description:
                "Create staff accounts and assign personnel to process document requests.",
            icon: "🧑‍💼",
            action: "Manage Staff",
            path: "/admin/staff",
        },
        {
            title: "Manage Requests",
            description:
                "Review all document requests (registered and guest) and monitor their processing status.",
            icon: "📋",
            action: "View Requests",
            path: "/admin/requests",
        },
        {
            title: "Document Types",
            description:
                "Manage the types of barangay documents available for requests.",
            icon: "📄",
            action: "Manage Documents",
            path: "/admin/document-types",
        },
    ];

    const formatDate = (value) => {
        if (!value) return "—";
        return new Date(value).toLocaleString();
    };

    const actorName = (entry) => {
        if (entry.user) {
            return `${entry.user.first_name} ${entry.user.last_name}`;
        }
        if (entry.staff?.user) {
            return `${entry.staff.user.first_name} ${entry.staff.user.last_name}`;
        }
        return "System";
    };

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                ADMINISTRATION
                            </span>

                            <h1>Admin Dashboard</h1>

                            <p>
                                Welcome back. Manage users, staff, document
                                requests, and system services from this
                                dashboard.
                            </p>
                        </div>
                    </div>

                    <section className="dashboard-section">
                        <div className="row g-4">
                            {statistics.map((statistic) => (
                                <div
                                    className="col-sm-6 col-xl-4"
                                    key={statistic.label}
                                >
                                    <div className="dashboard-stat-card">
                                        <div className="dashboard-stat-icon">
                                            {statistic.icon}
                                        </div>

                                        <div>
                                            <span className="dashboard-stat-label">
                                                {statistic.label}
                                            </span>

                                            <strong className="dashboard-stat-value">
                                                {statistic.value}
                                            </strong>

                                            <span className="dashboard-stat-description">
                                                {statistic.description}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-section">
                        <div className="section-heading dashboard-section-heading">
                            <span className="section-label">
                                SYSTEM MANAGEMENT
                            </span>

                            <h2>Administration</h2>

                            <p>
                                Select an administrative function to continue.
                            </p>
                        </div>

                        <div className="row g-4">
                            {managementCards.map((card) => (
                                <div className="col-md-6" key={card.title}>
                                    <div className="admin-management-card">
                                        <div className="admin-management-icon">
                                            {card.icon}
                                        </div>

                                        <div className="admin-management-content">
                                            <h3>{card.title}</h3>

                                            <p>{card.description}</p>

                                            <Link
                                                to={card.path}
                                                className="btn btn-success"
                                            >
                                                {card.action}
                                                <span className="ms-2">
                                                    →
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-section">
                        <div
                            className="section-heading dashboard-section-heading"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                                gap: "10px",
                            }}
                        >
                            <div>
                                <span className="section-label">
                                    SYSTEM ACTIVITY
                                </span>

                                <h2>Recent Activity</h2>

                                <p>
                                    The most recent administrative and document
                                    processing actions across the system.
                                </p>
                            </div>

                            <Link
                                to="/admin/recent-activity"
                                className="btn btn-outline-success btn-sm"
                            >
                                View all activity →
                            </Link>
                        </div>

                        {activity.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
                                    📊
                                </div>

                                <h3>No Recent Activity</h3>

                                <p>
                                    There is currently no activity to display.
                                    Activity will appear here once the system
                                    begins receiving requests and user actions.
                                </p>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {activity.map((entry) => (
                                    <div
                                        className="activity-item"
                                        key={entry.audit_log_id}
                                    >
                                        <div className="activity-item-icon">
                                            {entry.action === "created"
                                                ? "✚"
                                                : entry.action ===
                                                    "deleted"
                                                    ? "✕"
                                                    : entry.action ===
                                                        "status_changed"
                                                        ? "⟳"
                                                        : entry.action ===
                                                            "verification_updated"
                                                            ? "✓"
                                                            : "•"}
                                        </div>

                                        <div className="activity-item-content">
                                            <p className="activity-item-description">
                                                {entry.description}
                                            </p>
                                            <div className="activity-item-meta">
                                                <span>
                                                    {actorName(entry)}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {formatDate(
                                                        entry.created_at
                                                    )}
                                                </span>
                                                <span>•</span>
                                                <span className="activity-item-table">
                                                    {entry.table_name} #
                                                    {entry.record_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}