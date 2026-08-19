import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import Landing from "../pages/public/Landing";

import Login from "../pages/user/Login";
import Register from "../pages/user/Register";
import UserDashboard from "../pages/user/Dashboard";
import RequestDetails from "../pages/user/RequestDetails";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminLogin from "../pages/admin/Login";

import StaffLogin from "../pages/staff/Login";
import StaffDashboard from "../pages/staff/Dashboard";

import ProtectedRoute from "../components/auth/ProtectedRoute";

// Guest Pages
import GuestRequest from "../pages/guest/Request";
import TrackRequest from "../pages/guest/TrackRequest";

import StaffRequestDetails from "../pages/staff/RequestDetails";

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
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* USER - PROTECTED */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* USER REQUEST DETAILS - PROTECTED */}
                <Route
                    path="/requests/:requestId"
                    element={
                        <ProtectedRoute>
                            <RequestDetails />
                        </ProtectedRoute>
                    }
                />

                {/* ADMIN */}
                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />

                {/* GUEST */}
                <Route
                    path="/request"
                    element={<GuestRequest />}
                />

                <Route
                    path="/track-request"
                    element={<TrackRequest />}
                />

                <Route
                    path="/staff/login"
                    element={<StaffLogin />}
                />

               {/* STAFF - PROTECTED */}
                <Route
                    path="/staff/dashboard"
                    element={
                        <ProtectedRoute>
                            <StaffDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/staff/requests/:requestId"
                    element={
                        <ProtectedRoute>
                            <StaffRequestDetails />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}