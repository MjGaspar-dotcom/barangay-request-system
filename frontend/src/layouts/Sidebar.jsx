import { useAuth } from "../hooks/useAuth";
import {
    SidebarFooter,
    SidebarHeader,
    SidebarHeaderText,
    SidebarLink,
    SidebarLinkIcon,
    SidebarLogo,
    SidebarLogout,
    SidebarNavigation,
    SidebarRoot,
    SidebarUser,
} from "./Sidebar.styles";

function Sidebar({ items = [], onNavigate }) {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <SidebarRoot>
            <SidebarHeader>
                <SidebarLogo>B</SidebarLogo>

                <SidebarHeaderText>
                    <h2>Barangay</h2>
                    <span>Document System</span>
                </SidebarHeaderText>
            </SidebarHeader>

            <SidebarUser>
                <strong>{user?.first_name || user?.username || "User"}</strong>

                <span>{user?.role || "user"}</span>
            </SidebarUser>

            <SidebarNavigation>
                {items.map((item) => (
                    <SidebarLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                    >
                        {item.icon && (
                            <SidebarLinkIcon>{item.icon}</SidebarLinkIcon>
                        )}

                        <span>{item.label}</span>
                    </SidebarLink>
                ))}
            </SidebarNavigation>

            <SidebarFooter>
                <SidebarLogout type="button" onClick={handleLogout}>
                    <span>↪</span>
                    Logout
                </SidebarLogout>
            </SidebarFooter>
        </SidebarRoot>
    );
}

export default Sidebar;
