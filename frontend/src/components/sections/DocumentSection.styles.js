import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import { SectionRoot } from "./Section.styles";

export const DocumentSectionRoot = styled(SectionRoot)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
}));

export const DocumentGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 24,

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const DocumentCard = styled("div")(({ theme }) => ({
    height: "100%",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",

    "& h3": {
        margin: "0 0 12px",
        color: theme.palette.primary.dark,
        fontSize: 20,
    },

    "& p": {
        flex: 1,
        margin: "0 0 24px",
        color: theme.palette.text.secondary,
    },
}));

export const DocumentRequestButton = styled(Button)({
    width: "100%",
});
