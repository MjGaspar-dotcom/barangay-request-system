import { alpha, styled } from "@mui/material/styles";
import { Button } from "@mui/material";
import { RequestDetailItem } from "../../styles/requestDetails.styles";

export const AdminRequestDetailsRoot = styled("div")({
    width: "100%",
});

export const AdminRequestHeader = styled("header")(({ theme }) => ({
    marginBottom: theme.spacing(3),
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),

    "& h1": {
        margin: "6px 0 6px",
        color: theme.customColors.heading,
        fontSize: 30,
        fontWeight: 800,
    },

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
        fontSize: 14,
    },

    [theme.breakpoints.down("sm")]: {
        "& h1": {
            fontSize: 25,
        },
    },
}));

export const AdminRequestLabel = styled("span")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.2,
}));

export const AdminRequestColumns = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "minmax(0, 7fr) minmax(340px, 5fr)",
    gap: theme.spacing(3),

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const AdminRequestColumn = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
}));

export const AdminRequestPanel = styled("section")(({ theme }) => ({
    padding: theme.spacing(2.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const AdminRequestPanelTitle = styled("h2")(({ theme }) => ({
    margin: "0 0 18px",
    color: theme.palette.primary.dark,
    fontSize: 19,
    fontWeight: 700,
}));

export const AdminRequestFullWidthItem = styled(RequestDetailItem)({
    gridColumn: "1 / -1",
});

export const AdminRequestIdLink = styled("a")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));

export const RequestTimeline = styled("ul")({
    margin: 0,
    padding: 0,
    listStyle: "none",
});

export const RequestTimelineItem = styled("li", {
    shouldForwardProp: (prop) => prop !== "completed",
})(({ theme, completed }) => ({
    position: "relative",
    minHeight: 62,
    padding: "0 0 22px 34px",

    "&::before": {
        content: '""',
        position: "absolute",
        top: 17,
        bottom: -1,
        left: 7,
        width: 2,
        backgroundColor: completed
            ? alpha(theme.palette.success.main, 0.35)
            : theme.palette.divider,
    },

    "&:last-child": {
        minHeight: 0,
        paddingBottom: 0,
    },

    "&:last-child::before": {
        display: "none",
    },

    "& strong": {
        display: "block",
        color: completed
            ? theme.palette.primary.dark
            : theme.palette.text.secondary,
        fontSize: 14,
        fontWeight: 700,
    },
}));

export const RequestTimelineDot = styled("span", {
    shouldForwardProp: (prop) => prop !== "completed",
})(({ theme, completed }) => ({
    position: "absolute",
    top: 4,
    left: 0,
    zIndex: 1,
    width: 16,
    height: 16,
    border: `3px solid ${theme.palette.background.paper}`,
    borderRadius: "50%",
    backgroundColor: completed
        ? theme.palette.success.main
        : theme.palette.grey[300],
    boxShadow: `0 0 0 1px ${
        completed
            ? alpha(theme.palette.success.main, 0.3)
            : theme.palette.divider
    }`,
}));

export const RequestTimelineDate = styled("span")(({ theme }) => ({
    display: "block",
    marginTop: 4,
    color: theme.palette.text.secondary,
    fontSize: 12,
}));

export const StatusActionField = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(2),
}));

export const StatusActions = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
}));

export const FinalStatusMessage = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const DeleteRequestButton = styled(Button)(({ theme }) => ({
    marginLeft: "auto",

    [theme.breakpoints.down("sm")]: {
        width: "100%",
        marginLeft: 0,
    },
}));

export const BackButtonRow = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(0.5),
}));
