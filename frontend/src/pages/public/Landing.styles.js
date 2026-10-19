import {
    Button,
    Card,
    CardActionArea,
    CardContent,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

export const GuestPortalHero = styled("section")(({ theme }) => ({
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    textAlign: "center",

    [theme.breakpoints.down("md")]: {
        paddingTop: 10,
    },
}));

export const GuestLogoMark = styled("div")(({ theme }) => ({
    width: 92,
    height: 92,
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `4px solid ${theme.customColors.portal.logoBorder}`,
    borderRadius: "50%",
    backgroundColor: theme.customColors.portal.logoBackground,
    color: theme.customColors.portal.primaryText,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
    fontSize: 38,
    fontWeight: 800,

    [theme.breakpoints.down("md")]: {
        width: 78,
        height: 78,
        marginBottom: 18,
        fontSize: 32,
    },

    [theme.breakpoints.down("sm")]: {
        width: 70,
        height: 70,
        marginBottom: 16,
        fontSize: 28,
    },
}));

export const GuestWelcome = styled("div")(({ theme }) => ({
    marginBottom: 4,
    color: theme.customColors.portal.primaryText,
    fontSize: 32,
    fontWeight: 400,
    lineHeight: 1.2,

    [theme.breakpoints.down("md")]: {
        fontSize: 28,
    },

    [theme.breakpoints.down("sm")]: {
        fontSize: 23,
    },
}));

export const GuestTitle = styled("h1")(({ theme }) => ({
    margin: 0,
    color: theme.customColors.portal.primaryText,
    fontSize: "clamp(38px, 4.5vw, 58px)",
    fontWeight: 500,
    letterSpacing: -1.2,
    lineHeight: 1.08,

    "& span": {
        color: theme.customColors.portal.accent,
    },

    [theme.breakpoints.down("md")]: {
        fontSize: "clamp(34px, 7vw, 48px)",
        letterSpacing: -1,
    },

    [theme.breakpoints.down("sm")]: {
        fontSize: 32,
        letterSpacing: -0.8,
    },
}));

export const GuestDescription = styled("p")(({ theme }) => ({
    margin: "18px auto 0",
    color: theme.customColors.portal.secondaryText,
    fontSize: 15,
    lineHeight: 1.6,

    [theme.breakpoints.down("md")]: {
        marginTop: 16,
        fontSize: 14,
    },

    [theme.breakpoints.down("sm")]: {
        marginTop: 14,
        fontSize: 13,
    },
}));

export const GuestServices = styled("div")(({ theme }) => ({
    width: "100%",
    margin: "42px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 20,
    alignItems: "stretch",

    [theme.breakpoints.down("lg")]: {
        maxWidth: 760,
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("sm")]: {
        maxWidth: 360,
        marginTop: 32,
        gridTemplateColumns: "1fr",
        gap: 14,
    },
}));

const portalCardStyles = ({ theme }) => ({
    position: "relative",
    minHeight: 228,
    overflow: "hidden",
    display: "flex",
    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
    borderRadius: 18,
    color: theme.customColors.portal.primaryText,
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
    transition:
        "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",

    "&::after": {
        content: '""',
        position: "absolute",
        zIndex: 0,
        top: -42,
        right: -42,
        width: 105,
        height: 105,
        borderRadius: "50%",
        backgroundColor: theme.customColors.portal.cardDecoration,
        pointerEvents: "none",
    },

    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 18px 34px rgba(0, 0, 0, 0.22)",
        filter: "brightness(1.04)",
    },

    [theme.breakpoints.down("md")]: {
        minHeight: 218,
    },

    [theme.breakpoints.down("sm")]: {
        minHeight: 200,
        borderRadius: 16,
    },
});

export const GuestPortalCard = styled(Card)(({ theme }) => ({
    ...portalCardStyles({ theme }),
    backgroundColor: theme.customColors.portal.serviceCards.request,
}));

export const UserPortalCard = styled(Card)(({ theme }) => ({
    ...portalCardStyles({ theme }),
    backgroundColor: theme.customColors.portal.serviceCards.track,
}));

export const StaffPortalCard = styled(Card)(({ theme }) => ({
    ...portalCardStyles({ theme }),
    backgroundColor: theme.customColors.portal.serviceCards.signIn,
}));

export const AdminPortalCard = styled(Card)(({ theme }) => ({
    ...portalCardStyles({ theme }),
    backgroundColor: theme.customColors.portal.serviceCards.register,
}));

export const GuestPortalAction = styled(CardActionArea)(({ theme }) => ({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "stretch",
    color: theme.customColors.portal.primaryText,

    "&:hover": {
        color: theme.customColors.portal.primaryText,
    },

    "& .MuiCardActionArea-focusHighlight": {
        backgroundColor: alpha(theme.palette.common.white, 0.12),
    },

    "&.Mui-focusVisible": {
        outline: `3px solid ${theme.customColors.portal.accent}`,
        outlineOffset: -3,
    },
}));

export const GuestPortalContent = styled(CardContent)(({ theme }) => ({
    position: "relative",
    zIndex: 1,
    width: "100%",
    minHeight: "inherit",
    padding: "26px 20px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",

    "&:last-child": {
        paddingBottom: 18,
    },

    [theme.breakpoints.down("sm")]: {
        padding: "24px 18px 18px",

        "&:last-child": {
            paddingBottom: 18,
        },
    },
}));

export const GuestServiceIcon = styled("div")(({ theme }) => ({
    width: 56,
    height: 56,
    marginTop: 16,
    marginBottom: 16,
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
    borderRadius: "50%",
    backgroundColor: theme.customColors.portal.iconSurface,
    color: theme.customColors.portal.primaryText,

    "& svg": {
        fontSize: 28,
    },

    [theme.breakpoints.down("sm")]: {
        width: 52,
        height: 52,
        marginTop: 10,
        marginBottom: 14,

        "& svg": {
            fontSize: 26,
        },
    },
}));

export const GuestServiceTitle = styled("span")(({ theme }) => ({
    minHeight: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.customColors.portal.primaryText,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.35,
    textAlign: "center",

    [theme.breakpoints.down("sm")]: {
        fontSize: 15,
    },
}));

export const GuestServiceText = styled("span")(({ theme }) => ({
    minHeight: 34,
    maxWidth: 190,
    marginTop: 6,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    color: theme.customColors.portal.secondaryText,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.45,
    textAlign: "center",

    [theme.breakpoints.down("sm")]: {
        minHeight: 32,
        maxWidth: 220,
        fontSize: 12,
    },
}));

export const GuestActions = styled("div")(({ theme }) => ({
    width: "100%",
    marginTop: "auto",
    paddingTop: 14,
    display: "flex",
    justifyContent: "center",
    gap: 8,

    [theme.breakpoints.down("sm")]: {
        maxWidth: 280,
    },
}));

export const GuestAction = styled(Button)(({ theme }) => ({
    flex: 1,
    minHeight: 36,
    padding: "5px 8px",
    borderColor: alpha(theme.palette.common.white, 0.34),
    borderRadius: 9,
    backgroundColor: alpha(theme.palette.common.black, 0.08),
    color: theme.customColors.portal.primaryText,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,

    "&:hover": {
        borderColor: alpha(theme.palette.common.white, 0.58),
        backgroundColor: alpha(theme.palette.common.black, 0.16),
        color: theme.customColors.portal.primaryText,
    },

    "&:focus-visible": {
        outline: `2px solid ${theme.customColors.portal.accent}`,
        outlineOffset: 2,
    },
}));
