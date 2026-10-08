import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isAuthenticated, authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="page-loading">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>

                <p>Checking authentication...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        const loginPath = allowedRoles.includes("staff")
            ? "/staff/login"
            : "/admin/login";

        return <Navigate to={loginPath} replace />;
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

        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
