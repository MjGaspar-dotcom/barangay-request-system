import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const NavLinksRoot = styled("nav", {
    shouldForwardProp: (prop) => prop !== "isMobile",
})(({ isMobile }) => ({
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 18 : 28,
}));

export const NavigationLink = styled(Link)(({ theme }) => ({
    color: theme.palette.text.primary,
    fontSize: 15,
    fontWeight: 500,
    transition: "color 0.2s ease",

    "&:hover": {
        color: theme.palette.primary.main,
    },
}));
