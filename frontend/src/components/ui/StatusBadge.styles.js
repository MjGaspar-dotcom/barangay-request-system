import { styled } from "@mui/material/styles";

const getStatusColors = (theme, status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus === "pending") {
        return theme.statusColors.pending;
    }

    if (normalizedStatus === "approved") {
        return theme.statusColors.approved;
    }

    if (normalizedStatus === "processing") {
        return theme.statusColors.processing;
    }

    if (normalizedStatus === "ready for pickup") {
        return theme.statusColors.ready;
    }

    if (normalizedStatus === "completed" || normalizedStatus === "verified") {
        return theme.statusColors.completed;
    }

    if (normalizedStatus === "rejected") {
        return theme.statusColors.rejected;
    }

    if (normalizedStatus === "admin") {
        return theme.statusColors.processing;
    }

    if (normalizedStatus === "staff") {
        return theme.statusColors.approved;
    }

    if (normalizedStatus === "active") {
        return theme.statusColors.completed;
    }

    if (normalizedStatus === "inactive") {
        return theme.statusColors.rejected;
    }

    return theme.statusColors.neutral;
};

export const StatusBadgeRoot = styled("span", {
    shouldForwardProp: (prop) => prop !== "status" && prop !== "badgeSize",
})(({ theme, status, badgeSize }) => {
    const colors = getStatusColors(theme, status);
    const isSmall = badgeSize === "sm";

    return {
        display: "inline-block",
        padding: isSmall ? "2px 8px" : "4px 12px",
        borderRadius: 999,
        backgroundColor: colors.background,
        color: colors.color,
        fontSize: isSmall ? "11px" : "12px",
        fontWeight: 600,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
    };
});
