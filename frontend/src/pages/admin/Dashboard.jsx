function AdminDashboard() {
    // Temporary dashboard statistics.
    // These values will eventually come from the Laravel API.
    const statistics = [
        {
            label: "Total Users",
            value: "0",
            description: "Registered residents",
            icon: "👥",
        },
        {
            label: "Pending Requests",
            value: "0",
            description: "Requests awaiting processing",
            icon: "🕐",
        },
        {
            label: "Completed Requests",
            value: "0",
            description: "Successfully processed",
            icon: "✓",
        },
        {
            label: "Document Types",
            value: "0",
            description: "Available document services",
            icon: "📄",
        },
    ];

    // Main administrative functions.
    // The links will be connected to actual admin pages as we build them.
    const managementCards = [
        {
            title: "Manage Users",
            description:
                "View, manage, and monitor registered residents and their accounts.",
            icon: "👥",
            action: "Manage Users",
            path: "/admin/users",
        },
        {
            title: "Assign Staff",
            description:
                "Manage staff accounts and assign personnel to document processing tasks.",
            icon: "🧑‍💼",
            action: "Manage Staff",
            path: "/admin/staff",
        },
        {
            title: "Manage Requests",
            description:
                "Review document requests and monitor their processing status.",
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

    return (
        <div className="admin-dashboard">
            <div className="container-fluid">
                {/* =====================================================
                    DASHBOARD HEADER
                    ===================================================== */}
                <div className="dashboard-page-header">
                    <div>
                        <span className="section-label">ADMINISTRATION</span>

                        <h1>Admin Dashboard</h1>

                        <p>
                            Welcome back. Manage users, staff, document
                            requests, and system services from this dashboard.
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    STATISTICS
                    These are currently placeholder values.
                    They will be connected to the backend later.
                    ===================================================== */}
                <section className="dashboard-section">
                    <div className="row g-4">
                        {statistics.map((statistic) => (
                            <div
                                className="col-sm-6 col-xl-3"
                                key={statistic.label}
                            >
                                <div className="dashboard-stat-card">
                                    {/* Statistic icon */}
                                    <div className="dashboard-stat-icon">
                                        {statistic.icon}
                                    </div>

                                    {/* Statistic information */}
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

                {/* =====================================================
                    ADMIN MANAGEMENT
                    ===================================================== */}
                <section className="dashboard-section">
                    <div className="section-heading dashboard-section-heading">
                        <span className="section-label">SYSTEM MANAGEMENT</span>

                        <h2>Administration</h2>

                        <p>Select an administrative function to continue.</p>
                    </div>

                    <div className="row g-4">
                        {managementCards.map((card) => (
                            <div className="col-md-6" key={card.title}>
                                <div className="admin-management-card">
                                    {/* Card icon */}
                                    <div className="admin-management-icon">
                                        {card.icon}
                                    </div>

                                    {/* Card content */}
                                    <div className="admin-management-content">
                                        <h3>{card.title}</h3>

                                        <p>{card.description}</p>

                                        {/* Navigation button.
                                            These routes will be created
                                            when we build each admin page. */}
                                        <a
                                            href={card.path}
                                            className="btn btn-success"
                                        >
                                            {card.action}
                                            <span className="ms-2">→</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* =====================================================
                    RECENT ACTIVITY
                    ===================================================== */}
                <section className="dashboard-section">
                    <div className="section-heading dashboard-section-heading">
                        <span className="section-label">SYSTEM ACTIVITY</span>

                        <h2>Recent Activity</h2>

                        <p>
                            Recent administrative and document processing
                            activity will appear here.
                        </p>
                    </div>

                    <div className="dashboard-empty-state">
                        <div className="dashboard-empty-icon">📊</div>

                        <h3>No Recent Activity</h3>

                        <p>
                            There is currently no activity to display. Activity
                            will appear here once the system begins receiving
                            requests and user actions.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;
