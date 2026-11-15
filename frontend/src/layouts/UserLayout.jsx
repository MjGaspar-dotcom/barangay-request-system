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

function UserLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        {
            label: "Dashboard",
            group: "OVERVIEW",
            to: "/dashboard",
            icon: "⌂",
        },
        {
            label: "Request Document",
            group: "REQUESTS",
            to: "/request",
            icon: "＋",
        },
        {
            label: "Track Request",
            group: "REQUESTS",
            to: "/track-request",
            icon: "◷",
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

                    <strong>BarangayEase</strong>
                </DashboardMobileHeader>

                <DashboardContent>{children}</DashboardContent>
            </DashboardMain>
        </DashboardLayoutRoot>
    );
}

export default UserLayout;
