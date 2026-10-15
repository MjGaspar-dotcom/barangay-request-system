import { styled } from "@mui/material/styles";
import {
    AdminTableDataCell,
    AdminTableHeaderCell,
} from "../../components/admin/AdminCrud.styles";

const getActionColors = (theme, action) => {
    if (action === "created") {
        return theme.statusColors.completed;
    }

    if (action === "deleted") {
        return theme.statusColors.rejected;
    }

    if (action === "status_changed") {
        return theme.statusColors.approved;
    }

    if (action === "verification_updated") {
        return theme.statusColors.processing;
    }

    return theme.statusColors.neutral;
};

export const ActivityTypeHeaderCell = styled(AdminTableHeaderCell)({
    width: 64,
});

export const ActivityIconCell = styled(AdminTableDataCell)({
    width: 64,
});

export const ActivityIcon = styled("span", {
    shouldForwardProp: (prop) => prop !== "actionType",
})(({ theme, actionType }) => {
    const colors = getActionColors(theme, actionType);

    return {
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: colors.background,
        color: colors.color,
        fontWeight: 700,
    };
});

export const ActivitySecondaryText = styled("div")(({ theme }) => ({
    marginTop: 2,
    color: theme.palette.text.secondary,
    fontSize: 12,
}));

export const ActivityCode = styled("code")(({ theme }) => ({
    padding: "2px 5px",
    borderRadius: 4,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    fontFamily: "ui-monospace, Consolas, monospace",
    fontSize: 12,
}));

export const ActivityPagination = styled("nav")(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
}));

export const ActivityPageIndicator = styled("span")(({ theme }) => ({
    padding: "6px 12px",
    color: theme.palette.text.secondary,
    fontSize: 14,
}));
