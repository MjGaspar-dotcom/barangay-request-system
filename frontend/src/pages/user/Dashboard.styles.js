import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const ResidentPortal = styled("section")({
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
});

export const ResidentActions = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const ResidentServiceSteps = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",

    [theme.breakpoints.down("md")]: {
        alignItems: "stretch",
        flexDirection: "column",
        gap: theme.spacing(2),
    },
}));

export const ResidentStep = styled("div")(({ theme }) => ({
    flex: 1,
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),

    "& strong": {
        display: "block",
        marginBottom: theme.spacing(0.5),
        color: theme.palette.primary.dark,
        fontSize: 14,
        fontWeight: 800,
    },

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
        fontSize: 13,
        lineHeight: 1.55,
    },
}));

export const ResidentStepNumber = styled("span")(({ theme }) => ({
    minWidth: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    borderRadius: 9,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
}));

export const ResidentStepLine = styled("div")(({ theme }) => ({
    width: 32,
    height: 1,
    margin: `0 ${theme.spacing(1.25)}`,
    flex: "0 0 32px",
    backgroundColor: theme.palette.divider,

    [theme.breakpoints.down("md")]: {
        width: "100%",
        height: 1,
        margin: 0,
        flex: "0 0 1px",
    },
}));

export const ResidentAccount = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(0.75),
    color: theme.palette.text.secondary,
    fontSize: 13,

    [theme.breakpoints.down("sm")]: {
        flexWrap: "wrap",
    },
}));

export const ResidentAccountLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 700,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));
