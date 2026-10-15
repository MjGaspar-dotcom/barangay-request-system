import { styled } from "@mui/material/styles";
import { NavLink } from "react-router-dom";

export const SidebarRoot = styled("aside")(({ theme }) => ({
    position: "fixed",
    top: 0,
    bottom: 0,
    width: 260,
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.primary.dark,
    backgroundImage:
        "linear-gradient(180deg, #14532d 0%, #0f3f25 100%)",
    color: theme.palette.primary.contrastText,
}));

export const SidebarHeader = styled("div")({
    padding: "0 8px 24px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
});

export const SidebarLogo = styled("div")(({ theme }) => ({
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    fontSize: 20,
    fontWeight: 700,
}));

export const SidebarHeaderText = styled("div")({
    "& h2": {
        margin: 0,
        fontSize: 17,
    },

    "& span": {
        color: "#bbf7d0",
        fontSize: 12,
    },
});

export const SidebarUser = styled("div")({
    padding: "20px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,

    "& strong": {
        fontSize: 15,
    },

    "& span": {
        color: "#bbf7d0",
        fontSize: 12,
        textTransform: "capitalize",
    },
});

export const SidebarNavigation = styled("nav")({
    display: "flex",
    flexDirection: "column",
    gap: 6,
});

export const SidebarLink = styled(NavLink)({
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
    color: "#dcfce7",
    fontSize: 14,
    fontWeight: 600,
    transition:
        "background-color 0.2s ease, color 0.2s ease, transform 0.2s ease",

    "&:hover, &.active": {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        color: "#ffffff",
        transform: "translateX(2px)",
    },

    "&.active": {
        boxShadow: "inset 3px 0 0 #bbf7d0",
    },
});

export const SidebarLinkIcon = styled("span")({
    width: 20,
    textAlign: "center",
});

export const SidebarFooter = styled("div")({
    marginTop: "auto",
});

export const SidebarLogout = styled("button")({
    width: "100%",
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: 0,
    borderRadius: 10,
    backgroundColor: "transparent",
    color: "#dcfce7",
    textAlign: "left",
    cursor: "pointer",

    "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        color: "#ffffff",
    },
});
