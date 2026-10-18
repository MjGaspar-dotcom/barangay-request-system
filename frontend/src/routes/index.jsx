<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/public/Landing";

import Login from "../pages/user/Login";
import Register from "../pages/user/Register";
import UserDashboard from "../pages/user/Dashboard";
import RequestDetails from "../pages/user/RequestDetails";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminLogin from "../pages/admin/Login";
import ManageStaff from "../pages/admin/ManageStaff";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageRequests from "../pages/admin/ManageRequests";
import ManageDocumentTypes from "../pages/admin/ManageDocumentTypes";
import AdminRequestDetails from "../pages/admin/AdminRequestDetails";
import RecentActivity from "../pages/admin/RecentActivity";

import StaffLogin from "../pages/staff/Login";
import StaffDashboard from "../pages/staff/Dashboard";
import StaffRequestDetails from "../pages/staff/RequestDetails";
=======
=======
>>>>>>> Stashed changes
import { lazy, Suspense, useEffect } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
<<<<<<< Updated upstream
>>>>>>> Stashed changes

import GuestRequest from "../pages/guest/Request";
import IDScanner from "../pages/guest/IDScanner";
import TrackRequest from "../pages/guest/TrackRequest";
=======
>>>>>>> Stashed changes

import ProtectedRoute from "../components/auth/ProtectedRoute";
import LoadingState from "../components/ui/LoadingState";

const Landing = lazy(() => import("../pages/public/Landing"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
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

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <RouteScrollReset />
            <Suspense
                fallback={
                    <LoadingState
                        label="Loading page..."
                        className="route-loading"
                    />
                }
            >
                <Routes>
                    {/* PUBLIC */}
                    <Route path="/" element={<Landing />} />
<<<<<<< Updated upstream

<<<<<<< Updated upstream
                {/* AUTH */}
                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                {/* GUEST */}
                <Route path="/request" element={<GuestRequest />}>
                    <Route path="id-scan" element={<IDScanner />} />
                </Route>

                <Route path="/track-request" element={<TrackRequest />} />

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
=======
=======

>>>>>>> Stashed changes
                    {/* STAFF */}
                    <Route
                        path="/staff/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                    <Route
                        path="/staff/reports"
                        element={
                            <ProtectedRoute allowedRoles={["staff"]}>
                                <StaffReports />
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
                        path="/staff/requests/:type/:requestId"
                        element={
                            <ProtectedRoute allowedRoles={["staff", "admin"]}>
                                <StaffRequestDetails />
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
                        path="/admin/requests/:type/:requestId"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminRequestDetails />
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                <Route path="/staff/login" element={<StaffLogin />} />
            </Routes>
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        </BrowserRouter>
    );
}
