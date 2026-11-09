import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, StyledEngineProvider, ThemeProvider } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthProvider";
import theme from "./theme/theme";

import "./styles/tailwind.css";

import App from "./App";

if (import.meta.env.DEV) {
    import("./devtools");
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <StyledEngineProvider enableCssLayer>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <ErrorBoundary>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </StyledEngineProvider>
    </StrictMode>,
);
