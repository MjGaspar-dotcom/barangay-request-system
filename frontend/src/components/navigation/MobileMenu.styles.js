import { styled } from "@mui/material/styles";
import { LoginLink, RegisterLink } from "./navigation.styles";

export const MobileMenuRoot = styled("div")(({ theme }) => ({
    display: "none",

    [theme.breakpoints.down("md")]: {
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "20px 4%",
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
    },
}));

export const MobileMenuActions = styled("div")({
    display: "flex",
    flexDirection: "column",
    gap: 12,
});

export const MobileLoginLink = styled(LoginLink)({
    width: "100%",
    padding: 10,
    textAlign: "center",
});

export const MobileRegisterLink = styled(RegisterLink)({
    width: "100%",
});
