import { styled } from "@mui/material/styles";
import { TableCell, TableContainer } from "@mui/material";

export const TrackRequestForm = styled("form")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
}));

export const TrackRequestField = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
});

export const TrackResult = styled("section")({
    marginTop: 32,
});

export const TrackResultTitle = styled("h2")(({ theme }) => ({
    margin: "0 0 16px",
    color: theme.palette.primary.dark,
    fontSize: 20,
    fontWeight: 700,
}));

export const TrackTableContainer = styled(TableContainer)(({ theme }) => ({
    overflow: "hidden",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
}));

export const TrackLabelCell = styled(TableCell)(({ theme }) => ({
    width: "35%",
    color: theme.palette.text.primary,
    fontWeight: 700,
    backgroundColor: "#f8faf9",

    [theme.breakpoints.down("sm")]: {
        width: "42%",
        padding: 12,
        fontSize: 13,
    },
}));

export const TrackValueCell = styled(TableCell)(({ theme }) => ({
    color: theme.palette.text.primary,

    [theme.breakpoints.down("sm")]: {
        padding: 12,
        fontSize: 13,
    },
}));

export const TrackingNumberValue = styled("span")({
    fontFamily: "ui-monospace, Consolas, monospace",
    wordBreak: "break-word",
});
