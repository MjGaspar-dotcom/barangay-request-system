import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const PortalPage = styled("div")(({ theme }) => ({
    position: "relative",
    minHeight: "100vh",
    overflowX: "hidden",
    backgroundColor: theme.customColors.portal.background,
}));

export const PortalBackground = styled("div")(({ theme }) => ({
    position: "fixed",
    inset: 0,
    zIndex: 0,
    backgroundColor: theme.customColors.portal.background,
    backgroundImage: `
        radial-gradient(
            circle at 20% 20%,
            ${theme.customColors.portal.texture} 0,
            transparent 32%
        ),
        radial-gradient(
            circle at 80% 70%,
            ${theme.customColors.portal.texture} 0,
            transparent 30%
        ),
        linear-gradient(
            180deg,
            ${theme.customColors.portal.background} 0%,
            ${theme.customColors.portal.backgroundDeep} 100%
        )
    `,
    pointerEvents: "none",
}));

export const PortalContent = styled("div")({
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
});

export const PortalHeader = styled("header")(({ theme }) => ({
    width: "calc(100% - 32px)",
    maxWidth: 1500,
    margin: "16px auto 0",
    padding: "13px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: `1px solid ${theme.customColors.portal.headerBorder}`,
    borderRadius: 22,
    backgroundColor: theme.customColors.portal.headerSurface,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",

    [theme.breakpoints.down("md")]: {
        width: "calc(100% - 24px)",
        marginTop: 12,
        padding: "11px 14px",
        borderRadius: 18,
    },

    [theme.breakpoints.down("sm")]: {
        alignItems: "center",
    },
}));

export const PortalBrand = styled(Link)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: 11,
    color: theme.customColors.portal.primaryText,

    "&:hover": {
        color: theme.customColors.portal.primaryText,
    },
}));

export const PortalLogo = styled("div")(({ theme }) => ({
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${theme.customColors.portal.logoBorder}`,
    borderRadius: 10,
    backgroundColor: theme.customColors.portal.logoBackground,
    color: theme.customColors.portal.primaryText,
    fontSize: 18,
    fontWeight: 800,

    [theme.breakpoints.down("md")]: {
        width: 36,
        height: 36,
        borderRadius: 9,
        fontSize: 16,
    },
}));

export const PortalBrandText = styled("div")({
    display: "flex",
    flexDirection: "column",
    gap: 1,
});

export const PortalBrandName = styled("span")(({ theme }) => ({
    color: theme.customColors.portal.primaryText,
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.2,

    [theme.breakpoints.down("md")]: {
        fontSize: 13,
    },
}));

export const PortalBrandSubtitle = styled("span")(({ theme }) => ({
    color: theme.customColors.portal.mutedText,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.2,

    [theme.breakpoints.down("md")]: {
        fontSize: 13,
    },
}));

export const PortalHeaderLabel = styled("div")(({ theme }) => ({
    color: theme.customColors.portal.accent,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",

    [theme.breakpoints.down("md")]: {
        fontSize: 12,
        letterSpacing: 0.9,
    },

    [theme.breakpoints.down("sm")]: {
        display: "none",
    },
}));

export const PortalMain = styled("main")(({ theme }) => ({
    flex: 1,
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    padding: "42px 24px 50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    [theme.breakpoints.down("md")]: {
        padding: "38px 18px 45px",
        alignItems: "flex-start",
    },

    [theme.breakpoints.down("sm")]: {
        padding: "32px 15px 36px",
    },
}));

export const PortalFooter = styled("footer")(({ theme }) => ({
    width: "100%",
    margin: 0,
    padding: "15px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.customColors.portal.footerSurface,
    color: theme.customColors.portal.mutedText,
    fontSize: 13,
    lineHeight: 1.5,
    textAlign: "center",

    "& span:last-of-type": {
        color: theme.customColors.portal.accent,
    },

    [theme.breakpoints.down("md")]: {
        padding: "13px 18px",
        flexDirection: "column",
        gap: 2,
    },

    [theme.breakpoints.down("sm")]: {
        fontSize: 12,
    },
}));
