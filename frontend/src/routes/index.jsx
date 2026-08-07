// ===========================================
// FILE: src/routes/index.jsx
// PURPOSE:
// This file defines all application routes.
// It maps URL paths to React pages using
// react-router-dom.
//
// Public pages are wrapped with PublicLayout
// so they automatically display the Navbar
// and Footer.
// ===========================================

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import the reusable layout for public pages
import PublicLayout from "../layouts/PublicLayout";

// Public Pages
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";

// Authentication Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User Pages
import UserDashboard from "../pages/user/Dashboard";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ==========================================
                    PUBLIC ROUTES
                    These pages use PublicLayout so they
                    automatically display the Navbar and Footer.
                ========================================== */}

                <Route
                    path="/"
                    element={
                        <PublicLayout>
                            <Home />
                        </PublicLayout>
                    }
                />

                <Route
                    path="/about"
                    element={
                        <PublicLayout>
                            <About />
                        </PublicLayout>
                    }
                />

                <Route
                    path="/contact"
                    element={
                        <PublicLayout>
                            <Contact />
                        </PublicLayout>
                    }
                />

                {/* Authentication Routes */}

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Registered User Dashboard */}

                <Route path="/dashboard" element={<UserDashboard />} />

                {/* Administrator Dashboard */}

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />

            </Routes>
        </BrowserRouter>
    );
}