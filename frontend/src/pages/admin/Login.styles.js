import { styled } from "@mui/material/styles";
import { Button, Card } from "@mui/material";
import { Link } from "react-router-dom";

export const AdminAuthPage = styled("div")(({ theme }) => ({
    minHeight: "100vh",
    padding: "40px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
        "radial-gradient(circle at 15% 80%, rgba(22, 101, 52, 0.45) 0, rgba(22, 101, 52, 0) 28%), radial-gradient(circle at 85% 15%, rgba(34, 197, 94, 0.18) 0, rgba(34, 197, 94, 0) 25%), linear-gradient(135deg, #022c22 0%, #064e3b 100%)",

    [theme.breakpoints.down("sm")]: {
        padding: "20px 14px",
    },
}));

export const AdminAuthCard = styled(Card)({
    width: "100%",
    maxWidth: 460,
    padding: 0,
    overflow: "hidden",
    border: 0,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)",
});

export const AdminAuthHeader = styled("header")(({ theme }) => ({
    position: "relative",
    padding: "42px 32px 36px",
    overflow: "hidden",
    background:
        "linear-gradient(135deg, #065f46 0%, #047857 55%, #15803d 100%)",
    color: theme.palette.common.white,
    textAlign: "center",

    "&::before": {
        content: '\"\"',
        position: "absolute",
        width: 120,
        height: 120,
        top: -55,
        right: -35,
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },

    "&::after": {
        content: '\"\"',
        position: "absolute",
        width: 100,
        height: 100,
        bottom: -55,
        left: -35,
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.07)",
    },

    "& > *": {
        position: "relative",
        zIndex: 1,
    },

    "& h1": {
        margin: "0 0 8px",
        color: theme.palette.common.white,
        fontSize: 25,
        fontWeight: 700,
    },

    "& p": {
        maxWidth: 330,
        margin: "0 auto",
        color: "#d1fae5",
        fontSize: 12,
        lineHeight: 1.5,
    },

    [theme.breakpoints.down("sm")]: {
        padding: "34px 24px 30px",

        "& h1": {
            fontSize: 22,
        },
    },
}));

export const AdminAuthLogo = styled("div")(({ theme }) => ({
    width: 58,
    height: 58,
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.palette.common.white,
    color: theme.palette.primary.main,
    fontSize: 27,
    fontWeight: 800,
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
}));

export const AdminAuthLabel = styled("span")({
    display: "block",
    marginBottom: 8,
    color: "#dcfce7",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
});

export const AdminAuthBody = styled("div")(({ theme }) => ({
    padding: "34px 34px 28px",

    [theme.breakpoints.down("sm")]: {
        padding: "28px 22px 24px",
    },
}));

export const AdminAuthWelcome = styled("div")(({ theme }) => ({
    marginBottom: 26,
    textAlign: "center",

    "& h2": {
        margin: "0 0 4px",
        color: theme.palette.primary.dark,
        fontSize: 22,
        fontWeight: 700,
    },

    "& p": {
        margin: 0,
        color: theme.palette.grey[400],
        fontSize: 12,
    },
}));

export const AdminAuthForm = styled("form")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
}));

export const AdminAuthField = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
});

export const AdminLoginButton = styled(Button)({
    width: "100%",
    height: 48,
    marginTop: 8,
    borderRadius: 12,
    background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    boxShadow: "0 8px 18px rgba(22, 101, 52, 0.2)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",

    "&:hover": {
        background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)",
        transform: "translateY(-1px)",
        boxShadow: "0 10px 22px rgba(22, 101, 52, 0.28)",
    },

    "&.Mui-disabled": {
        color: "#ffffff",
        opacity: 0.7,
    },
});

export const AdminAuthFooter = styled("div")({
    marginTop: 22,
    paddingTop: 18,
    borderTop: "1px solid #f3f4f6",
    textAlign: "center",
    fontSize: 12,
});

export const AdminAuthFooterLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));
