import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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

import ProtectedRoute from "../components/auth/ProtectedRoute";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/admin/login" replace />} />
                <Route path="/login" element={<Navigate to="/admin/login" replace />} />

                <Route
                    path="/staff/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["staff"]}>
                            <StaffDashboard />
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

                <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
