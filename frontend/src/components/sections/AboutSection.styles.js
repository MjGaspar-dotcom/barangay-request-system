import { styled } from "@mui/material/styles";
import { SectionRoot } from "./Section.styles";

export const AboutSectionRoot = styled(SectionRoot)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));

export const AboutGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 24,

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const InfoCard = styled("div")(({ theme }) => ({
    height: "100%",
    padding: 28,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor: "#f8faf9",

    "& h3": {
        margin: "0 0 12px",
        color: theme.palette.primary.dark,
        fontSize: 20,
    },

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
    },
}));
