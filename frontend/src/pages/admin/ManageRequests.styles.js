import { alpha, styled } from "@mui/material/styles";

const getStatColors = (theme, statType) => {
    if (statType === "pending") {
        return {
            background: theme.statusColors.pending.background,
            color: theme.statusColors.pending.color,
        };
    }

    if (statType === "approved") {
        return {
            background: theme.statusColors.approved.background,
            color: theme.statusColors.approved.color,
        };
    }

    if (statType === "processing") {
        return {
            background: theme.statusColors.processing.background,
            color: theme.statusColors.processing.color,
        };
    }

    if (statType === "ready") {
        return {
            background: theme.statusColors.ready.background,
            color: theme.statusColors.ready.color,
        };
    }

    if (statType === "completed") {
        return {
            background: theme.statusColors.completed.background,
            color: theme.statusColors.completed.color,
        };
    }

    if (statType === "rejected") {
        return {
            background: theme.statusColors.rejected.background,
            color: theme.statusColors.rejected.color,
        };
    }

    return {
        background: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.dark,
    };
};

export const RequestStatsGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("xl")]: {
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const RequestStatCard = styled("div")(({ theme }) => ({
    minHeight: 92,
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
}));

export const RequestStatIcon = styled("div", {
    shouldForwardProp: (prop) => prop !== "statType",
})(({ theme, statType }) => {
    const colors = getStatColors(theme, statType);

    return {
        flex: "0 0 auto",
        width: 42,
        height: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: colors.background,
        color: colors.color,
        fontSize: 16,
        fontWeight: 800,
    };
});

export const RequestStatContent = styled("div")({
    minWidth: 0,
});

export const RequestStatLabel = styled("span")(({ theme }) => ({
    display: "block",
    color: theme.palette.text.secondary,
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
}));

export const RequestStatValue = styled("strong")(({ theme }) => ({
    display: "block",
    marginTop: 3,
    color: theme.palette.text.primary,
    fontSize: 22,
    fontWeight: 800,
}));

export const RequestList = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
}));

export const RequestCard = styled("article")(({ theme }) => ({
    padding: theme.spacing(2.25),
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",

    "&:hover": {
        borderColor: alpha(theme.palette.primary.main, 0.2),
        boxShadow: "0 5px 18px rgba(0, 0, 0, 0.04)",
    },

    [theme.breakpoints.down("sm")]: {
        flexDirection: "column",
    },
}));

export const RequestTypeIcon = styled("div", {
    shouldForwardProp: (prop) => prop !== "requestType",
})(({ theme, requestType }) => ({
    flex: "0 0 auto",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor:
        requestType === "registered"
            ? theme.statusColors.completed.background
            : theme.statusColors.pending.background,
    fontSize: 20,
}));

export const RequestCardContent = styled("div")({
    minWidth: 0,
    flex: 1,
});

export const RequestCardHeader = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(1),
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.25),
}));

export const RequesterName = styled("h3")(({ theme }) => ({
    margin: "0 0 4px",
    color: theme.palette.text.primary,
    fontSize: 17,
    fontWeight: 700,
}));

export const RequestMeta = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const RequestTypeText = styled("span")({
    textTransform: "capitalize",
});

export const RequestPurpose = styled("p")(({ theme }) => ({
    margin: "8px 0",
    color: theme.palette.text.primary,
    fontSize: 14,
    lineHeight: 1.6,
}));

export const RequestRemarks = styled("p")(({ theme }) => ({
    margin: "4px 0",
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const RequestIdRow = styled("p")(({ theme }) => ({
    margin: "6px 0 10px",
    color: theme.palette.text.primary,
    fontSize: 13,
}));

export const RequestIdLink = styled("a")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));

export const RequestSubmitted = styled("p")(({ theme }) => ({
    margin: "0 0 12px",
    color: theme.palette.grey[400],
    fontSize: 12,
}));

export const RequestActions = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
}));
