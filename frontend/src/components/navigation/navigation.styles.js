import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const LoginLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,
    transition: "color 0.2s ease",

    "&:hover": {
        color: theme.palette.primary.dark,
    },
}));

export const RegisterLink = styled(Link)(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 18px",
    borderRadius: 6,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    transition: "background-color 0.2s ease, transform 0.2s ease",

    "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText,
        transform: "translateY(-1px)",
    },
}));
