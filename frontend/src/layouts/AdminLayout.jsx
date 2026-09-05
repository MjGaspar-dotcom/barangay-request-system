import { useState } from "react";
import Sidebar from "./Sidebar";

function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        {
            label: "Dashboard",
            to: "/admin/dashboard",
            icon: "▦",
        },
        {
            label: "Manage Users",
            to: "/admin/users",
            icon: "👥",
        },
        {
            label: "Manage Staff",
            to: "/admin/staff",
            icon: "🧑‍💼",
        },
        {
            label: "Manage Requests",
            to: "/admin/requests",
            icon: "📋",
        },
        {
            label: "Document Types",
            to: "/admin/document-types",
            icon: "📄",
        },
        {
            label: "Recent Activity",
            to: "/admin/recent-activity",
            icon: "📊",
        },
    ];

    return (
        <div className="dashboard-layout">
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
                        ☰
                    </button>

                    <strong>Admin Panel</strong>
                </header>

                <main className="dashboard-content">{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;

