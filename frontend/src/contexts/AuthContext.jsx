import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() =>
        localStorage.getItem("auth_token"),
    );
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifyAuthentication = async () => {
            const storedToken = localStorage.getItem("auth_token");

            if (!storedToken) {
                setAuthLoading(false);
                return;
            }

            try {
                const response = await api.get("/user");

                const authenticatedUser = response.data?.data ?? response.data;

                setUser(authenticatedUser);
                setToken(storedToken);
            } catch (error) {
                console.error("Authentication verification failed:", error);

                localStorage.removeItem("auth_token");
                setToken(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        verifyAuthentication();
    }, []);

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

        localStorage.setItem("auth_token", authToken);

        setToken(authToken);

        const authenticatedUser =
            responseData.data ?? responseData.user ?? null;

        const role = responseData.role ?? authenticatedUser?.role;

        const completeUser = authenticatedUser
            ? {
                  ...authenticatedUser,
                  role,
              }
            : {
                  role,
              };

        setUser(completeUser);

        return responseData;
    };

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

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(token && user),
        authLoading,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
}
