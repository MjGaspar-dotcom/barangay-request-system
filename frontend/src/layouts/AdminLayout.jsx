import Icon from "../components/ui/Icon.jsx";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { ADMIN_NAV_ITEMS } from "./adminNavigation";

function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout admin-management-layout">
            <div
                className={`dashboard-sidebar-wrapper ${sidebarOpen ? "open" : ""
                    }`}
            >
                <Sidebar
                    items={ADMIN_NAV_ITEMS}
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
