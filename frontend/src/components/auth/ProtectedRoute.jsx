import CircularProgress from "@mui/material/CircularProgress";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
<<<<<<< HEAD
=======
import {
    AuthenticationLoading,
    AuthenticationLoadingText,
} from "./ProtectedRoute.styles";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isAuthenticated, authLoading } = useAuth();
    const location = useLocation();

    if (authLoading) {
        return (
            <AuthenticationLoading>
                <CircularProgress
                    color="success"
                    size={32}
                    aria-label="Checking authentication"
                />

                <AuthenticationLoadingText>
                    Checking authentication...
                </AuthenticationLoadingText>
            </AuthenticationLoading>
        );
    }

    if (!isAuthenticated) {
        const loginPath = location.pathname.startsWith("/admin")
            ? "/admin/login"
            : "/staff/login";

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
