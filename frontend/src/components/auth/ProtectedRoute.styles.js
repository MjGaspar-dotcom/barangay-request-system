import { styled } from "@mui/material/styles";

export const AuthenticationLoading = styled("div")(({ theme }) => ({
    minHeight: "50vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1.5),
}));

export const AuthenticationLoadingText = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
}));
