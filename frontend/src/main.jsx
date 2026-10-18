import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";

import ErrorBoundary from "./components/ErrorBoundary";
<<<<<<< Updated upstream
import { AuthProvider } from "./contexts/AuthProvider";
import theme from "./theme/theme";
=======

import "./styles/tokens.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "./styles/index.css";
import "./components/navigation/Navbar.css";
import "./components/layout/Footer.css";
import "./styles/polish.css";
import "./styles/animation-polish.css";
import "./styles/direction-c.css";

import "bootstrap-icons/font/bootstrap-icons.css";

>>>>>>> Stashed changes
import App from "./App";

if (import.meta.env.DEV) {
    import("./devtools");
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <ErrorBoundary>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
    </StrictMode>,
);
