import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export const HeroSectionRoot = styled("section")(({ theme }) => ({
    padding: "96px 0",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",

    [theme.breakpoints.down("md")]: {
        padding: "64px 0",
    },
}));

export const HeroContainer = styled("div")({
    width: "min(1200px, 92%)",
    margin: "0 auto",
});

export const HeroGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "7fr 5fr",
    alignItems: "center",
    gap: 40,

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const HeroLabel = styled("span")(({ theme }) => ({
    display: "inline-block",
    marginBottom: 14,
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
}));

export const HeroTitle = styled("h1")(({ theme }) => ({
    maxWidth: 700,
    margin: "0 0 20px",
    color: theme.palette.primary.dark,
    fontSize: "clamp(40px, 5vw, 64px)",
    lineHeight: 1.1,
    fontWeight: 700,

    "& span": {
        color: theme.palette.primary.main,
    },
}));

export const HeroDescription = styled("p")(({ theme }) => ({
    maxWidth: 650,
    margin: "0 0 30px",
    color: theme.palette.text.secondary,
    fontSize: 19,
}));

export const HeroActions = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: 12,

    [theme.breakpoints.down("md")]: {
        flexDirection: "column",
    },
}));

const HeroActionLink = styled(Link)(({ theme }) => ({
    minHeight: 48,
    padding: "0 22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.shape.borderRadius,
    fontSize: 16,
    fontWeight: 600,
    transition:
        "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",

    [theme.breakpoints.down("md")]: {
        width: "100%",
    },
}));

export const HeroPrimaryAction = styled(HeroActionLink)(({ theme }) => ({
    border: `1px solid ${theme.palette.success.main}`,
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,

    "&:hover": {
        backgroundColor: theme.palette.success.dark,
        borderColor: theme.palette.success.dark,
        color: theme.palette.success.contrastText,
    },
}));

export const HeroSecondaryAction = styled(HeroActionLink)(({ theme }) => ({
    border: `1px solid ${theme.palette.success.main}`,
    backgroundColor: "transparent",
    color: theme.palette.success.main,

    "&:hover": {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
    },
}));

export const HeroServiceCard = styled("div")(({ theme }) => ({
    padding: 36,
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 12px 35px rgba(20, 83, 45, 0.08)",

    "& h2": {
        margin: "0 0 12px",
        color: theme.palette.primary.dark,
        fontSize: 24,
    },

    "& > p": {
        margin: "0 0 24px",
        color: theme.palette.text.secondary,
    },
}));

export const HeroServiceIcon = styled("div")(({ theme }) => ({
    width: 58,
    height: 58,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.palette.primary.light,
    fontSize: 28,
}));

export const HeroServiceList = styled("div")({
    display: "flex",
    flexDirection: "column",
    gap: 12,
});

export const HeroServiceItem = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: theme.palette.text.primary,

    "& span": {
        color: theme.palette.success.main,
        fontWeight: 700,
    },
}));
