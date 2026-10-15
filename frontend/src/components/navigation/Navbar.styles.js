import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import { Link } from "react-router-dom";

export const NavbarRoot = styled("header")(({ theme }) => ({
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 2px 14px rgba(20, 83, 45, 0.04)",
}));

export const NavbarContainer = styled("div")({
    width: "min(1200px, 92%)",
    minHeight: 72,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
});

export const NavbarBrand = styled(Link)({
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: 12,
});

export const NavbarLogo = styled("div")(({ theme }) => ({
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: 20,
    fontWeight: 700,

    [theme.breakpoints.down("sm")]: {
        width: 38,
        height: 38,
        fontSize: 17,
    },
}));

export const NavbarTitle = styled("div")({
    display: "flex",
    flexDirection: "column",
});

export const BarangayName = styled("span")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontSize: 16,
    fontWeight: 700,

    [theme.breakpoints.down("sm")]: {
        fontSize: 14,
    },
}));

export const SystemName = styled("span")(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: 12,

    [theme.breakpoints.down("md")]: {
        display: "none",
    },
}));

export const DesktopNavigation = styled("div")(({ theme }) => ({
    [theme.breakpoints.down("md")]: {
        display: "none",
    },
}));

export const NavbarActions = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: 16,

    [theme.breakpoints.down("md")]: {
        display: "none",
    },
}));

export const MobileMenuButton = styled(IconButton)(({ theme }) => ({
    display: "none",
    width: 42,
    height: 42,
    color: theme.palette.primary.main,

    [theme.breakpoints.down("md")]: {
        display: "inline-flex",
    },
}));

export const MobileNavbarContainer = styled(NavbarContainer)(({ theme }) => ({
    [theme.breakpoints.down("sm")]: {
        width: "94%",
        minHeight: 64,
    },
}));
