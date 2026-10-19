import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";

export const DashboardLayoutRoot = styled("div")(({ theme }) => ({
    minHeight: "100vh",
    display: "flex",
    backgroundColor: theme.palette.background.default,
    backgroundImage:
        "linear-gradient(180deg, rgba(22, 101, 52, 0.025) 0%, transparent 240px)",
}));

export const SidebarWrapper = styled("div", {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: 260,
    flexShrink: 0,

    [theme.breakpoints.down("md")]: {
        position: "fixed",
        zIndex: 1050,
        top: 0,
        bottom: 0,
        left: open ? 0 : -260,
        transition: "left 0.2s ease",
    },
}));

export const SidebarOverlay = styled("button")(({ theme }) => ({
    display: "none",

    [theme.breakpoints.down("md")]: {
        position: "fixed",
        zIndex: 1040,
        inset: 0,
        display: "block",
        padding: 0,
        border: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
    },
}));

export const DashboardMain = styled("div")({
    flex: 1,
    minWidth: 0,
});

export const DashboardMobileHeader = styled("header")(({ theme }) => ({
    display: "none",

    [theme.breakpoints.down("md")]: {
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: 64,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 18px rgba(20, 83, 45, 0.05)",
    },
}));

export const DashboardMenuButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

export const DashboardContent = styled("main")(({ theme }) => ({
    width: "100%",
    maxWidth: 1440,
    margin: "0 auto",
    padding: 40,

    [theme.breakpoints.down("md")]: {
        padding: "24px 16px",
    },
}));
