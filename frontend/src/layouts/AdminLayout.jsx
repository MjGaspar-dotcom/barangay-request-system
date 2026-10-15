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
                        <MenuIcon />
                    </DashboardMenuButton>

                    <strong>Admin Panel</strong>
                </DashboardMobileHeader>

                <DashboardContent>{children}</DashboardContent>
            </DashboardMain>
        </DashboardLayoutRoot>
    );
}

export default AdminLayout;
