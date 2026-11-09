import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingState from "../ui/LoadingState";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isAuthenticated, authLoading } = useAuth();
    const location = useLocation();
    const loginPath = location.pathname.startsWith("/admin/")
        ? "/admin/login"
        : "/staff/login";

    if (authLoading) {
        return (
            <LoadingState
                label="Restoring your session..."
                className="logo-loading"
            />
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to={loginPath}
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    if (
        allowedRoles.length > 0 &&
        (!user?.role || !allowedRoles.includes(user.role))
    ) {
        if (user?.role === "admin") {
            return <Navigate to="/admin/dashboard" replace />;
        }

        if (user?.role === "staff") {
            return <Navigate to="/staff/dashboard" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
