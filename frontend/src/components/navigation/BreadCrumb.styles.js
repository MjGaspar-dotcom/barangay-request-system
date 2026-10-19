import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const BreadcrumbRoot = styled("nav")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: 14,
}));

export const BreadcrumbLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 500,

    "&:hover": {
        textDecoration: "underline",
    },
}));

export const BreadcrumbItem = styled("span")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
}));

export const BreadcrumbSeparator = styled("span")(({ theme }) => ({
    color: theme.palette.grey[400],
}));

export const BreadcrumbCurrent = styled("span")(({ theme }) => ({
    color: theme.palette.text.secondary,
}));
