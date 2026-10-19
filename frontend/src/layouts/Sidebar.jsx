<<<<<<< HEAD
import { NavLink, useNavigate } from "react-router-dom";
=======
import BrandMark from "../components/ui/BrandMark";
import { Link, useLocation, useNavigate } from "react-router-dom";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
import { useAuth } from "../hooks/useAuth";

function Sidebar({ items = [], onNavigate }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
<<<<<<< HEAD
=======
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
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

    const handleLogout = async () => {
        onNavigate?.();
        navigate("/", { replace: true });
        await logout();
    };

    const isAdmin = user?.role === "admin";
    const isStaff = user?.role === "staff";

    return (
        <aside className={`dashboard-sidebar ${isAdmin ? "sidebar-admin" : ""} ${isStaff ? "sidebar-staff" : ""}`}>
            <div className="sidebar-header">
                <BrandMark className="sidebar-logo" />

                <div>
                    <h2>Barangay Aurora</h2>
                    <span>Document System</span>
                </div>
            </div>

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
    );
}

export default Sidebar;
