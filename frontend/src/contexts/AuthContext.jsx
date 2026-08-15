import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const [token, setToken] = useState(
        localStorage.getItem("auth_token")
    );

    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const restoreUser = async () => {
            const storedToken = localStorage.getItem("auth_token");

            if (!storedToken) {
                setAuthLoading(false);
                return;
            }

            try {
                const response = await api.get("/user");

                setUser(response.data.data);
            } catch (error) {
                console.error("Failed to restore user:", error);

                localStorage.removeItem("auth_token");
                setToken(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        restoreUser();
    }, []);

    const login = async (username, password) => {
        const response = await api.post("/login", {
            username,
            password,
        });

        const { token, data } = response.data;

        localStorage.setItem("auth_token", token);

        setToken(token);
        setUser(data);

        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("auth_token");
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token,
                authLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}