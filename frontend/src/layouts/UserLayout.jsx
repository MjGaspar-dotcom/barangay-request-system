import { useState } from "react";
import Sidebar from "./Sidebar";

function UserLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        {
            label: "Dashboard",
            to: "/dashboard",
            icon: "⌂",
        },
        {
            label: "Request Document",
            to: "/request",
            icon: "＋",
        },
        {
            label: "Track Request",
            to: "/track-request",
            icon: "◷",
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

                    <strong>Barangay Document System</strong>
                </header>

                <main className="dashboard-content">{children}</main>
            </div>
        </div>
    );
}

export default UserLayout;
