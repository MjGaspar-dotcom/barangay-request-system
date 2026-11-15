import Icon from "../components/ui/Icon.jsx";
import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import BrandMark from "../components/ui/BrandMark";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Sidebar({ items = [], onNavigate }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const navigationRef = useRef(null);
    const navigationScrollKey = `sidebar-scroll:${user?.role || "guest"}:${items
        .map((item) => item.to)
        .join("|")}`;
    const [visibleAnchor, setVisibleAnchor] = useState("");
    const visibleAnchorRef = useRef("");
    const [loggingOut, setLoggingOut] = useState(false);

    useLayoutEffect(() => {
        const navigation = navigationRef.current;
        const savedScrollTop = sessionStorage.getItem(navigationScrollKey);
        if (!navigation || savedScrollTop === null) {
            return;
        }

        const scrollTop = Number(savedScrollTop);
        if (Number.isFinite(scrollTop)) {
            navigation.scrollTop = scrollTop;
        }
    }, [navigationScrollKey]);

    const updateVisibleAnchor = (anchor) => {
        visibleAnchorRef.current = anchor;
        setVisibleAnchor(anchor);
    };

    useEffect(() => {
        const anchoredItems = items
            .map((item) => {
                const [path, hash] = item.to.split("#");
                return path === location.pathname && hash
                    ? { hash, target: document.getElementById(hash) }
                    : null;
            })
            .filter((item) => item?.target);

        if (!anchoredItems.length) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries.find(
                    (entry) => entry.isIntersecting,
                );
                if (visibleEntry) {
                    updateVisibleAnchor(visibleEntry.target.id);
                } else if (
                    entries.some(
                        (entry) =>
                            entry.target.id === visibleAnchorRef.current &&
                            !entry.isIntersecting,
                    )
                ) {
                    updateVisibleAnchor("");
                }
            },
            { threshold: 0.2, rootMargin: "-15% 0px -65% 0px" },
        );

        anchoredItems.forEach(({ target }) => observer.observe(target));
        return () => observer.disconnect();
    }, [items, location.pathname]);

    const underPath = (prefix) =>
        location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);

    // An item is active when its path matches, or when the URL hash matches
    // for "#anchor" items. A plain item is not active while one of its
    // "#anchor" siblings is the current target, so only one item lights up.
    const isItemActive = (item) => {
        if ((item.also || []).some(underPath)) return true;

        const [path, hash] = item.to.split("#");
        if (!underPath(path)) return false;
        if (hash) {
            return (
                location.hash === `#${hash}` ||
                (!location.hash && visibleAnchor === hash)
            );
        }

        return !items.some((other) => {
            const [otherPath, otherHash] = other.to.split("#");
            return (
                otherHash &&
                otherPath === path &&
                (location.hash === `#${otherHash}` ||
                    (!location.hash && visibleAnchor === otherHash))
            );
        });
    };

    const handleLogout = async () => {
        setLoggingOut(true);
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

                <div className="sidebar-brand-copy">
                    <h2 className="sidebar-brand-name">BarangayEase</h2>
                    <span className="sidebar-brand-subtitle">
                        Barangay Aurora
                    </span>
                </div>
            </div>

            {!isAdmin && !isStaff && (
                <div className="sidebar-user">
                    <strong>{user?.first_name || user?.username || "User"}</strong>
                    <span>{user?.role || "user"}</span>
                </div>
            )}

            <nav ref={navigationRef} className="sidebar-navigation">
                {!items.some((item) => item.group) && (isAdmin || isStaff) && (
                    <span className="sidebar-menu-label">MENU</span>
                )}
                {items.map((item, index) => {
                    const active = isItemActive(item);
                    const startsGroup =
                        item.group && item.group !== items[index - 1]?.group;

                    return (
                        <Fragment key={item.to}>
                            {startsGroup && (
                                <span
                                    className={`sidebar-section-label ${
                                        item.mobileOnly
                                            ? "mobile-only-navigation-item"
                                            : ""
                                    }`}
                                >
                                    {item.group}
                                </span>
                            )}
                            <Link
                                to={item.to}
                                onClick={() => {
                                    const navigation = navigationRef.current;
                                    if (navigation) {
                                        sessionStorage.setItem(
                                            navigationScrollKey,
                                            String(navigation.scrollTop),
                                        );
                                    }
                                    onNavigate?.();
                                }}
                                className={`sidebar-link ${
                                    item.mobileOnly
                                        ? "mobile-only-navigation-item"
                                        : ""
                                } ${active ? "active" : ""}`}
                                aria-current={active ? "page" : undefined}
                            >
                                {item.icon && (
                                    <span className="sidebar-link-icon">
                                        <Icon name={item.icon} />
                                    </span>
                                )}

                                <span>{item.label}</span>
                            </Link>
                        </Fragment>
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
                            disabled={loggingOut}
                            aria-busy={loggingOut || undefined}
                            aria-label={loggingOut ? "Logging out" : undefined}
                        >
                            <Icon name="box-arrow-right" />
                            Logout
                        </button>
                    </div>
                )}
                {!isAdmin && !isStaff && (
                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        aria-busy={loggingOut || undefined}
                        aria-label={loggingOut ? "Logging out" : undefined}
                    >
                        <Icon name="box-arrow-right" />
                        Logout
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
