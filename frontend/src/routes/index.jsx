import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import Landing from "../pages/public/Landing";

import Login from "../pages/user/Login";
import Register from "../pages/user/Register";
import UserDashboard from "../pages/user/Dashboard";
import RequestDetails from "../pages/user/RequestDetails";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminLogin from "../pages/admin/Login";
import Staff from "../pages/admin/staff";

import StaffLogin from "../pages/staff/Login";
import StaffDashboard from "../pages/staff/Dashboard";
import StaffRequestDetails from "../pages/staff/RequestDetails";

import GuestRequest from "../pages/guest/Request";
import TrackRequest from "../pages/guest/TrackRequest";

import ProtectedRoute from "../components/auth/ProtectedRoute";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC */}
                <Route
                    path="/"
                    element={
                        <PublicLayout>
                            <Landing />
                        </PublicLayout>
                    }
                />

                {/* AUTH */}
                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                {/* GUEST */}
                <Route path="/request" element={<GuestRequest />} />

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
                    path="/admin/staff"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <Staff />
                        </ProtectedRoute>
                    }
                />

                {/* ROLE-SPECIFIC LOGIN */}
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route path="/staff/login" element={<StaffLogin />} />
            </Routes>
        </BrowserRouter>
    );
}
