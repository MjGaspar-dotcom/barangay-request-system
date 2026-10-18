<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
import BrandMark from "../components/ui/BrandMark";
import { Link, useLocation, useNavigate } from "react-router-dom";
>>>>>>> Stashed changes
=======
import BrandMark from "../components/ui/BrandMark";
import { Link, useLocation, useNavigate } from "react-router-dom";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
    const navigate = useNavigate();
    const location = useLocation();

    const underPath = (prefix) =>
        location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);

    // An item is active when its path matches, or when the URL hash matches
    // for "#anchor" items. A plain item is not active while one of its
    // "#anchor" siblings is the current target, so only one item lights up.
    const isItemActive = (item) => {
        if ((item.also || []).some(underPath)) return true;

        const [path, hash] = item.to.split("#");
        if (!underPath(path)) return false;
        if (hash) return location.hash === `#${hash}`;

        return !items.some((other) => {
            const [otherPath, otherHash] = other.to.split("#");
            return otherHash && otherPath === path && location.hash === `#${otherHash}`;
        });
    };
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

    const handleLogout = async () => {
        await logout();
    };

    return (
<<<<<<< Updated upstream
        <SidebarRoot>
            <SidebarHeader>
                <SidebarLogo>B</SidebarLogo>

                <SidebarHeaderText>
                    <h2>Barangay</h2>
=======
        <aside className={`dashboard-sidebar ${isAdmin ? "sidebar-admin" : ""} ${isStaff ? "sidebar-staff" : ""}`}>
            <div className="sidebar-header">
                <BrandMark className="sidebar-logo" />

                <div>
                    <h2>Barangay Aurora</h2>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                    <span>Document System</span>
                </SidebarHeaderText>
            </SidebarHeader>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
            {!isAdmin && !isStaff && (
                <div className="sidebar-user">
                    <strong>{user?.first_name || user?.username || "User"}</strong>
                    <span>{user?.role || "user"}</span>
                </div>
            )}

            <nav className="sidebar-navigation">
                {(isAdmin || isStaff) && (
                    <span className="sidebar-menu-label">MENU</span>
                )}
                {items.map((item) => {
                    const active = isItemActive(item);

=======
            {!isAdmin && !isStaff && (
                <div className="sidebar-user">
                    <strong>{user?.first_name || user?.username || "User"}</strong>
                    <span>{user?.role || "user"}</span>
                </div>
            )}

            <nav className="sidebar-navigation">
                {(isAdmin || isStaff) && (
                    <span className="sidebar-menu-label">MENU</span>
                )}
                {items.map((item) => {
                    const active = isItemActive(item);

>>>>>>> Stashed changes
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onNavigate}
                            className={`sidebar-link ${active ? "active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            {item.icon && (
                                <span className="sidebar-link-icon">
                                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                                </span>
                            )}

                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                {(isAdmin || isStaff) && (
                    <div className="sidebar-account-card">
                        <div className="sidebar-user">
                            <strong>
                                {user?.first_name || user?.username || "User"}
                            </strong>
                            <span className="sidebar-role-label">
                                {isAdmin ? "System Admin" : "Staff"}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="sidebar-logout"
                            onClick={handleLogout}
                        >
                            <i
                                className="bi bi-box-arrow-right"
                                aria-hidden="true"
                            />
                            Logout
                        </button>
                    </div>
                )}
                {!isAdmin && !isStaff && (
                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <i
                            className="bi bi-box-arrow-right"
                            aria-hidden="true"
                        />
                        Logout
                    </button>
                )}
            </div>
        </aside>
>>>>>>> Stashed changes
    );
}

export default Sidebar;
