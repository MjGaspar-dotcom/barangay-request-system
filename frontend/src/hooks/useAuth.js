import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
<<<<<<< HEAD
}
=======
}
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
