import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";

<<<<<<< HEAD
import { AuthProvider } from "./contexts/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";

import "./assets/styles/global.css";
import "./assets/styles/navbar.css";
import "./assets/styles/footer.css";
=======
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthProvider";
import theme from "./theme/theme"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

import "./styles/tokens.css";
import "bootstrap/dist/css/bootstrap.min.css";
<<<<<<< HEAD
import "bootstrap-icons/font/bootstrap-icons.css";
=======
import "./styles/theme.css";
import "./styles/index.css";
import "./components/navigation/Navbar.css";
import "./components/layout/Footer.css";
import "./styles/polish.css";
import "./styles/animation-polish.css";
import "./styles/direction-c.css";

import "bootstrap-icons/font/bootstrap-icons.css";

>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

import App from "./App";

if (import.meta.env.DEV) {
    import("./devtools");
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
<<<<<<< HEAD
        <ErrorBoundary>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ErrorBoundary>
=======
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <ErrorBoundary>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
    </StrictMode>,
);
