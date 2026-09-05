
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const [token, setToken] = useState(() =>
        localStorage.getItem("auth_token")
    );

    const [authLoading, setAuthLoading] = useState(true);

    // =========================================
    // RESTORE AUTHENTICATION AFTER PAGE REFRESH
    // =========================================
    useEffect(() => {
        const verifyAuthentication = async () => {
            const storedToken = localStorage.getItem("auth_token");

            // No token = not authenticated
            if (!storedToken) {
                setAuthLoading(false);
                return;
            }

            try {
                const response = await api.get("/user");

                const authenticatedUser =
                    response.data?.data ?? response.data;

                const userRole =
                    response.data?.role ?? authenticatedUser?.role;

                setUser({
                    ...authenticatedUser,
                    role: userRole,
                });

                setToken(storedToken);
            } catch (error) {
                console.error(
                    "Authentication verification failed:",
                    error
                );

                localStorage.removeItem("auth_token");

                setToken(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        verifyAuthentication();
    }, []);

    // =========================================
    // LOGIN
    // =========================================
    const login = async (username, password) => {
        const response = await api.post("/login", {
            username,
            password,
        });

        const responseData = response.data;
        const authToken = responseData.token;

        if (!authToken) {
            throw new Error("Authentication token was not returned.");
        }

        // Save token
        localStorage.setItem("auth_token", authToken);
        setToken(authToken);

        // Get authenticated user
        const userResponse = await api.get("/user");

        const authenticatedUser =
            userResponse.data?.data ?? userResponse.data;

        const userRole =
            userResponse.data?.role ??
            responseData.role ??
            authenticatedUser?.role;

        const completeUser = {
            ...authenticatedUser,
            role: userRole,
        };

        setUser(completeUser);

        return responseData;
    };

    // =========================================
    // LOGOUT
    // =========================================
    const logout = async () => {
        try {
            if (token) {
                await api.post("/logout");
            }
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            localStorage.removeItem("auth_token");

            setToken(null);
            setUser(null);
        }
    };

    // =========================================
    // AUTH CONTEXT VALUE
    // =========================================
    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(token && user),
        authLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =========================================
// USE AUTH HOOK
// =========================================
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider"
        );
    }

    return context;
}

