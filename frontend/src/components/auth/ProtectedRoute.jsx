import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isAuthenticated, authLoading } = useAuth();
    const location = useLocation();

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
        return (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
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

        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;
