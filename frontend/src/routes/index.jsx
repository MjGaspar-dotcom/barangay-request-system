import { lazy, Suspense, useEffect } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import Login from "../pages/user/Login";
import Register from "../pages/user/Register";
import UserDashboard from "../pages/user/Dashboard";
import RequestDetails from "../pages/user/RequestDetails";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoadingState from "../components/ui/LoadingState";

const UserRequest = lazy(() => import("../pages/user/Request"));
const UserProfile = lazy(() => import("../pages/user/Profile"));
const TrackRequest = lazy(() => import("../pages/user/TrackRequest"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminAnalytics = lazy(() => import("../pages/staff/Reports"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageStaff = lazy(() => import("../pages/admin/ManageStaff"));
const ManageRequests = lazy(() => import("../pages/admin/ManageRequests"));
const ManageDocumentTypes = lazy(
    () => import("../pages/admin/ManageDocumentTypes"),
);
const DocumentTemplates = lazy(
    () => import("../pages/admin/DocumentTemplates"),
);
const ManageRecommendations = lazy(
    () => import("../pages/admin/ManageRecommendations"),
);
const RecentActivity = lazy(() => import("../pages/admin/RecentActivity"));
const StaffLogin = lazy(() => import("../pages/staff/Login"));
const StaffDashboard = lazy(() => import("../pages/staff/Dashboard"));
const StaffRequestQueue = lazy(() => import("../pages/staff/RequestQueue"));
const RequestProcessingPage = lazy(
    () => import("../pages/shared/RequestProcessingPage"),
);
const GeneratedDocumentPage = lazy(
    () => import("../pages/shared/GeneratedDocumentPage"),
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
                    <Route
                        path="/"
                        element={<Navigate to="/staff/login" replace />}
                    />
                    <Route path="/track-request" element={<TrackRequest />} />

                    {/* AUTH */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* RESIDENT / USER */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/request"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <UserRequest />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <UserProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requests/:requestId"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <RequestDetails />
                            </ProtectedRoute>
                        }
                    />

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
                        path="/staff/analytics"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <AdminAnalytics />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/document-types"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <ManageDocumentTypes isAdmin={false} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/recent-activity"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <RecentActivity isAdmin={false} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/reports"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <Navigate to="/admin/analytics" replace />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/requests"
                        element={
                            <ProtectedRoute allowedRoles={["staff", "admin"]}>
                                <ManageRequests isAdmin={false} />
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
                                <RequestProcessingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/staff/requests/:requestId/document"
                        element={
                            <ProtectedRoute allowedRoles={["staff", "admin"]}>
                                <GeneratedDocumentPage />
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
                                <RequestProcessingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/requests/:requestId/document"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <GeneratedDocumentPage />
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
                        path="/admin/document-templates"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <DocumentTemplates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/recommendations"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <ManageRecommendations />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/barangay-settings"
                        element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route
                        path="/admin/recent-activity"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <RecentActivity />
                            </ProtectedRoute>
                        }
                    />
                    {/* Both staff and administrators use the shared login form. */}
                    <Route
                        path="/admin/login"
                        element={<Navigate to="/staff/login" replace />}
                    />
                    <Route path="/staff/login" element={<StaffLogin />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
