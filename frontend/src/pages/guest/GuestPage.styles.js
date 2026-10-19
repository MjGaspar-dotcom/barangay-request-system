import { Card } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const GuestPageRoot = styled("main")(({ theme }) => ({
    minHeight: "100vh",
    padding: "64px 20px",
    backgroundColor: theme.palette.background.default,
    backgroundImage:
        "radial-gradient(circle at top right, rgba(22, 101, 52, 0.06), transparent 30%)",

    [theme.breakpoints.down("sm")]: {
        padding: "40px 16px",
    },
}));

export const GuestPageContainer = styled("div")({
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
});

export const GuestBackHomeLink = styled(Link)(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    marginBottom: theme.spacing(3),
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));

export const GuestPageCard = styled(Card)(({ theme }) => ({
    padding: 32,
    border: `1px solid ${theme.customColors.borderSoft}`,
    borderRadius: 20,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 16px 44px rgba(20, 83, 45, 0.07)",

    [theme.breakpoints.down("sm")]: {
        padding: 20,
    },
}));
