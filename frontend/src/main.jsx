import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthProvider } from "./contexts/AuthContext";

import "./assets/styles/global.css";
import "./assets/styles/navbar.css";
import "./assets/styles/footer.css";

import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>,
);
