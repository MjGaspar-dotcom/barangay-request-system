import { styled } from "@mui/material/styles";

export const FooterRoot = styled("footer")(({ theme }) => ({
    marginTop: 0,
    padding: "48px 0 20px",
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,

    [theme.breakpoints.down("md")]: {
        padding: "36px 0 20px",
    },
}));

export const FooterContainer = styled("div")({
    width: "min(1200px, 92%)",
    margin: "0 auto",
});

export const FooterContent = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: 48,
    paddingBottom: 32,

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
        gap: 28,
    },
}));

export const FooterBrand = styled("div")(({ theme }) => ({
    "& h3": {
        marginBottom: 12,
        fontWeight: 700,
    },

    "& p": {
        maxWidth: 520,
        margin: "0 0 8px",
        color: theme.palette.primary.light,
    },
}));

export const FooterInfo = styled("div")(({ theme }) => ({
    "& h4": {
        marginBottom: 12,
        fontWeight: 700,
    },

    "& p": {
        margin: "0 0 8px",
        color: theme.palette.primary.light,
    },
}));

export const FooterBottom = styled("div")({
    paddingTop: 20,
    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
    textAlign: "center",
});

export const FooterCopyright = styled("p")({
    margin: 0,
    color: "#bbf7d0",
    fontSize: 14,
});
