import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import Landing from "../pages/public/Landing";

import Login from "../pages/user/Login";
import Register from "../pages/user/Register";

import UserDashboard from "../pages/user/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";

// Guest Pages
import GuestRequest from "../pages/guest/Request";
import TrackRequest from "../pages/guest/TrackRequest";

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


                {/* USER */}
                <Route
                    path="/dashboard"
                    element={<UserDashboard />}
                />


                {/* ADMIN */}
                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
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

                    
            </Routes>

        </BrowserRouter>
    );
}