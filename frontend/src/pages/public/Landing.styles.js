import { Card } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

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
