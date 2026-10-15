import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

/*
|--------------------------------------------------------------------------
| Shared Portal Layout
|--------------------------------------------------------------------------
| All four portal landing pages use this layout:
|
| 1. Guest
| 2. Resident / User
| 3. Staff
| 4. Administrator
|
| The barangay photograph is placed in a separate background layer.
| This allows us to control the image opacity without affecting
| the text, buttons, cards, or other content.
|--------------------------------------------------------------------------
*/

function PortalLayout({
    children,
    portalLabel = "BARANGAY ONLINE SERVICES",
    sidebarItems,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hasSidebar = Boolean(sidebarItems?.length);

    return (
        <div
            className={`portal-page ${
                hasSidebar ? "portal-dashboard-page" : ""
            } ${portalLabel === "STAFF & ADMINISTRATION" ? "portal-staff-admin-page" : ""} ${
                portalLabel === "STAFF SERVICES" ? "portal-staff-workspace" : ""
            } ${portalLabel === "ADMINISTRATION" ? "portal-admin-workspace" : ""}`}
        >
            {/* 
                Background photograph.
                Its opacity is controlled entirely through CSS.
            */}
            <div className="portal-background" aria-hidden="true"></div>

            {/* 
                Main portal content.
                This stays fully visible above the background image.
            */}
            <div
                className={
                    hasSidebar ? "portal-dashboard-layout" : "portal-content"
                }
            >
                {hasSidebar && (
                    <>
                        <div
                            className={`portal-dashboard-sidebar ${
                                sidebarOpen ? "open" : ""
                            }`}
                        >
                            <Sidebar
                                items={sidebarItems}
                                onNavigate={() => setSidebarOpen(false)}
                            />
                        </div>
                        {sidebarOpen && (
                            <button
                                type="button"
                                className="portal-sidebar-overlay"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Close navigation"
                            />
                        )}
                    </>
                )}

                <div
                    className={`portal-content ${
                        hasSidebar ? "portal-dashboard-main" : ""
                    }`}
                >
                    {!hasSidebar && (
                        <header className="portal-header">
                            <Link to="/" className="portal-brand">
                                <div className="portal-logo">B</div>

                                <div className="portal-brand-text">
                                    <span className="portal-brand-name">
                                        Barangay System
                                    </span>

                                    <span className="portal-brand-subtitle">
                                        Document Services
                                    </span>
                                </div>
                            </Link>

                            <div className="portal-header-label">
                                {portalLabel}
                            </div>
                        </header>
                    )}

                    {hasSidebar && (
                        <button
                            type="button"
                            className="portal-menu-button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                            aria-expanded={sidebarOpen}
                        >
                            <i className="bi bi-list" aria-hidden="true" />
                        </button>
                    )}

                    <main className="portal-main">{children}</main>

                    <footer className="portal-footer">
                        <span>
                            Integrated Barangay Document Request,
                            Processing, and Analytics System
                        </span>

                        <span>© 2026</span>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default PortalLayout;
