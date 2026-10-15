import { styled } from "@mui/material/styles";
import { SectionRoot } from "./Section.styles";

export const RequirementSectionRoot = styled(SectionRoot)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));

export const RequirementGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 24,

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const RequirementCard = styled("div")(({ theme }) => ({
    height: "100%",
    padding: 28,
    display: "flex",
    gap: 20,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor: "#f8faf9",

    "& h3": {
        margin: "0 0 8px",
        color: theme.palette.primary.dark,
        fontSize: 19,
    },

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
    },
}));

export const RequirementNumber = styled("div")(({ theme }) => ({
    flexShrink: 0,
    color: theme.palette.primary.main,
    fontSize: 18,
    fontWeight: 700,
}));
