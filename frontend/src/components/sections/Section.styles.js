import { styled } from "@mui/material/styles";

export const SectionRoot = styled("section")(({ theme }) => ({
    padding: "80px 0",

    [theme.breakpoints.down("md")]: {
        padding: "56px 0",
    },
}));

export const SectionContainer = styled("div")({
    width: "min(1200px, 92%)",
    margin: "0 auto",
});

export const SectionHeading = styled("div")(({ theme }) => ({
    maxWidth: 760,
    margin: "0 auto 48px",
    textAlign: "center",

    [theme.breakpoints.down("md")]: {
        marginBottom: 32,
    },
}));

export const SectionLabel = styled("span")(({ theme }) => ({
    display: "inline-block",
    marginBottom: 10,
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
}));

export const SectionTitle = styled("h2")(({ theme }) => ({
    margin: "0 0 16px",
    color: theme.palette.primary.dark,
    fontSize: 36,
    fontWeight: 700,

    [theme.breakpoints.down("md")]: {
        fontSize: 30,
    },
}));

export const SectionDescription = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 17,

    [theme.breakpoints.down("md")]: {
        fontSize: 16,
    },
}));
