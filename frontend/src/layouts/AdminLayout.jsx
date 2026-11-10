import Icon from "../components/ui/Icon.jsx";
import { useState } from "react";
import Sidebar from "./Sidebar";

function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        {
            label: "Dashboard",
            to: "/admin/dashboard",
            icon: "speedometer2",
        },
        {
            label: "System Analytics",
            to: "/admin/analytics",
            icon: "bar-chart-line",
        },
        {
            label: "Manage Users",
            to: "/admin/users",
            icon: "users",
        },
        {
            label: "Manage Staff",
            to: "/admin/staff",
            icon: "person-badge",
        },
        {
            label: "Manage Requests",
            to: "/admin/requests",
            icon: "clipboard-check",
        },
        {
            label: "Document Types",
            to: "/admin/document-types",
            icon: "file-earmark-text",
        },
        {
            label: "Recent Activity",
            to: "/admin/recent-activity",
            icon: "activity",
        },
        {
            label: "Workflow Analysis",
            to: "/admin/workflow-analysis",
            icon: "diagram-3",
        },
    ];

    return (
        <div className="dashboard-layout admin-management-layout">
            <div
                className={`dashboard-sidebar-wrapper ${sidebarOpen ? "open" : ""
                    }`}
            >
                <Sidebar
                    items={navigationItems}
                    onNavigate={() => setSidebarOpen(false)}
                />
            </div>

            {sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <div className="dashboard-main">
                <header className="dashboard-mobile-header">
                    <button
                        type="button"
                        className="dashboard-menu-button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Icon name="list" />
                    </button>

                    <strong>Admin Panel</strong>
                </header>

                <main className="dashboard-content">{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;
