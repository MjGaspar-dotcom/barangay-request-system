import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ items = [], onNavigate }) {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">B</div>

                <div>
                    <h2>Barangay</h2>
                    <span>Document System</span>
                </div>
            </div>

            <div className="sidebar-user">
                <strong>{user?.first_name || user?.username || "User"}</strong>

                <span>{user?.role || "user"}</span>
            </div>

            <nav className="sidebar-navigation">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        {item.icon && (
                            <span className="sidebar-link-icon">
                                {item.icon}
                            </span>
                        )}

                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={handleLogout}
                >
                    <span>↪</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
