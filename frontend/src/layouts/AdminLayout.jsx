import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";
import {
    DashboardContent,
    DashboardLayoutRoot,
    DashboardMain,
    DashboardMenuButton,
    DashboardMobileHeader,
    SidebarOverlay,
    SidebarWrapper,
} from "./DashboardLayout.styles";

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
        <DashboardLayoutRoot>
            <SidebarWrapper open={sidebarOpen}>
                <Sidebar
                    items={navigationItems}
                    onNavigate={() => setSidebarOpen(false)}
                />
            </SidebarWrapper>

            {sidebarOpen && (
                <SidebarOverlay
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <DashboardMain>
                <DashboardMobileHeader>
                    <DashboardMenuButton
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation"
                    >
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                        <MenuIcon />
                    </DashboardMenuButton>
=======
=======
>>>>>>> Stashed changes
                        <i className="bi bi-list" aria-hidden="true" />
                    </button>
>>>>>>> Stashed changes

                    <strong>Admin Panel</strong>
                </DashboardMobileHeader>

                <DashboardContent>{children}</DashboardContent>
            </DashboardMain>
        </DashboardLayoutRoot>
    );
}

export default AdminLayout;
