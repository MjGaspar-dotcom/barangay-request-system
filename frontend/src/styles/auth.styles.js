import { styled } from "@mui/material/styles";
import { Alert, Avatar, Button, Card } from "@mui/material";
import { Link } from "react-router-dom";

export const AuthPage = styled("div")(({ theme }) => ({
    minHeight: "calc(100vh - 80px)",
    padding: "72px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.background.default,
    backgroundImage:
        "radial-gradient(circle at top right, rgba(22, 101, 52, 0.07), transparent 34%)",

    [theme.breakpoints.down("sm")]: {
        padding: "32px 16px",
    },
}));

export const AuthCard = styled(Card)(({ theme }) => ({
    width: "100%",
    maxWidth: 520,
    padding: 40,
    border: `1px solid ${theme.customColors.borderSoft}`,
    borderRadius: 20,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 18px 50px rgba(20, 83, 45, 0.08)",

    [theme.breakpoints.down("sm")]: {
        padding: "28px 20px",
    },
}));

export const AuthCardWide = styled(AuthCard)({
    maxWidth: 850,
});

export const AuthHeader = styled("div")({
    marginBottom: 30,
    textAlign: "center",
});

export const AuthLogo = styled(Avatar)(({ theme }) => ({
    width: 56,
    height: 56,
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: 26,
    fontWeight: 800,
}));

export const AuthLabel = styled("span")(({ theme }) => ({
    display: "inline-block",
    marginBottom: 10,
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
}));

export const AuthTitle = styled("h1")(({ theme }) => ({
    margin: "0 0 10px",
    color: theme.palette.primary.dark,
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: "-0.02em",
}));

export const AuthDescription = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
}));

export const AuthMessage = styled(Alert)({
    marginBottom: 20,
});

export const AuthForm = styled("form")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2.5),
}));

export const AuthFormField = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
});

export const AuthSubmitButton = styled(Button)({
    width: "100%",
    minHeight: 48,
});

export const AuthMiddleNameOption = styled(FormControlLabel)(
    ({ theme }) => ({
        width: "fit-content",
        marginTop: theme.spacing(0.5),
        marginLeft: 0,
        marginRight: 0,
        color: theme.palette.text.secondary,

        "& .MuiFormControlLabel-label": {
            fontSize: theme.typography.validationError.fontSize,
            lineHeight: theme.typography.validationError.lineHeight,
        },

        "& .MuiCheckbox-root": {
            padding: theme.spacing(0.75),
            marginRight: theme.spacing(0.5),
        },
    }),
);

export const AuthFooter = styled("div")(({ theme }) => ({
    marginTop: 24,
    color: theme.palette.text.secondary,
    textAlign: "center",

    "& p": {
        margin: "0 0 8px",
    },
}));

export const AuthFooterLink = styled(Link)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));

export const FormSection = styled("section")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2.5),
}));

export const FormSectionTitle = styled("h2")(({ theme }) => ({
    margin: 0,
    color: theme.palette.primary.dark,
    fontSize: 20,
    fontWeight: 700,
}));

export const TwoColumnFormGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(2),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const ThreeColumnFormGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: theme.spacing(2),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const FullWidthField = styled("div")({
    minWidth: 0,
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
});
