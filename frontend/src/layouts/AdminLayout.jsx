import { useState } from "react";
import Sidebar from "./Sidebar";

function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        {
            label: "Dashboard",
            to: "/admin/dashboard",
            icon: "bi-speedometer2",
        },
        {
            label: "Manage Users",
            to: "/admin/users",
            icon: "bi-people",
        },
        {
            label: "Manage Staff",
            to: "/admin/staff",
            icon: "bi-person-badge",
        },
        {
            label: "Manage Requests",
            to: "/admin/requests",
            icon: "bi-clipboard-check",
        },
        {
            label: "Document Types",
            to: "/admin/document-types",
            icon: "bi-file-earmark-text",
        },
        {
            label: "Recent Activity",
            to: "/admin/recent-activity",
            icon: "bi-activity",
        },
    ];

    return (
        <div className="dashboard-layout admin-management-layout">
            <div
                className={`dashboard-sidebar-wrapper ${
                    sidebarOpen ? "open" : ""
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
                        <i className="bi bi-list" aria-hidden="true" />
                    </button>

                    <strong>Admin Panel</strong>
                </header>

                <main className="dashboard-content">{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;
