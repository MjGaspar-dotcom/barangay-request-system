import { lazy, Suspense, useEffect } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoadingState from "../components/ui/LoadingState";

const Landing = lazy(() => import("../pages/public/Landing"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminAnalytics = lazy(() => import("../pages/staff/Reports"));
const AdminLogin = lazy(() => import("../pages/admin/Login"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageStaff = lazy(() => import("../pages/admin/ManageStaff"));
const ManageRequests = lazy(() => import("../pages/admin/ManageRequests"));
const ManageDocumentTypes = lazy(
    () => import("../pages/admin/ManageDocumentTypes"),
);
const AdminRequestDetails = lazy(
    () => import("../pages/admin/AdminRequestDetails"),
);
const RecentActivity = lazy(() => import("../pages/admin/RecentActivity"));
const StaffLogin = lazy(() => import("../pages/staff/Login"));
const StaffDashboard = lazy(() => import("../pages/staff/Dashboard"));
const StaffAllRequests = lazy(() => import("../pages/staff/AllRequests"));
const StaffRequestQueue = lazy(() => import("../pages/staff/RequestQueue"));
const StaffReports = lazy(() => import("../pages/staff/Reports"));
const StaffRequestDetails = lazy(
    () => import("../pages/staff/RequestDetails"),
);

function RouteScrollReset() {
    const { pathname } = useLocation();

    useEffect(() => {
        const reduceMotion = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: reduceMotion ? "auto" : "smooth",
        });
    }, [pathname]);

    return null;
}

function RouteLoadingFallback() {
    return (
        <LoadingState
            label="Loading page..."
            className="route-loading logo-loading"
        />
    );
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <RouteScrollReset />
            <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                    {/* PUBLIC */}
                    <Route path="/" element={<Landing />} />

                    {/* STAFF */}
                    <Route
                        path="/staff/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/reports"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <StaffReports />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/requests"
                        element={
                            <ProtectedRoute allowedRoles={["staff", "admin"]}>
                                <StaffAllRequests />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/queue"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <StaffRequestQueue />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/requests/:requestId"
                        element={
                            <ProtectedRoute allowedRoles={["staff", "admin"]}>
                                <StaffRequestDetails />
                            </ProtectedRoute>
                        }
                    />

                    {/* ADMIN */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/analytics"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminAnalytics isAdmin />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <ManageUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/staff"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <ManageStaff />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/requests"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <ManageRequests />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/requests/:requestId"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminRequestDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/document-types"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <ManageDocumentTypes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/recent-activity"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <RecentActivity />
                            </ProtectedRoute>
                        }
                    />

                    {/* ROLE-SPECIFIC LOGIN */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/staff/login" element={<StaffLogin />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
