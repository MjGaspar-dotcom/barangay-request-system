import { styled } from "@mui/material/styles";

export const ErrorContainer = styled("div")(({ theme }) => ({
    padding: theme.spacing(2.5),
    fontFamily: "ui-monospace, Consolas, monospace",
}));

export const ErrorDetails = styled("pre")(({ theme }) => ({
    padding: theme.spacing(1.25),
    overflow: "auto",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.grey[100],
}));
