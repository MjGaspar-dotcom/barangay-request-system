import { styled } from "@mui/material/styles";

export const RequestDetailsPage = styled("div")({
    width: "min(1000px, 92%)",
    margin: "0 auto",
    padding: "40px 0",
});

export const RequestDetailsCard = styled("div")(({ theme }) => ({
    padding: 28,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.04)",

    [theme.breakpoints.down("sm")]: {
        padding: 20,
    },
}));

export const RequestDetailsHeader = styled("div")(({ theme }) => ({
    marginBottom: 28,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",

    "& h1": {
        margin: 0,
        color: theme.palette.primary.dark,
        fontSize: 30,
        fontWeight: 700,
    },
}));

export const RequestDetailsSection = styled("section")(({ theme }) => ({
    padding: "24px 0",
    borderTop: `1px solid ${theme.palette.divider}`,

    "&:first-of-type": {
        borderTop: 0,
        paddingTop: 0,
    },
}));

export const RequestDetailsSectionTitle = styled("h3")(({ theme }) => ({
    margin: "0 0 18px",
    color: theme.palette.primary.dark,
    fontSize: 19,
    fontWeight: 700,
}));

export const RequestDetailsGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const RequestDetailItem = styled("div")({
    minWidth: 0,
});

export const RequestDetailLabel = styled("span")(({ theme }) => ({
    display: "block",
    marginBottom: 4,
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
}));

export const RequestDetailValue = styled("span")(({ theme }) => ({
    display: "block",
    color: theme.palette.text.primary,
    fontSize: 15,
    wordBreak: "break-word",
}));

export const RequestDetailLink = styled("a")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,

    "&:hover": {
        color: theme.palette.primary.dark,
        textDecoration: "underline",
    },
}));

export const RequestActions = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
}));

export const RequestBackRow = styled("div")({
    marginTop: 24,
});

export const RequestPageState = styled("div")(({ theme }) => ({
    minHeight: "50vh",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    gap: theme.spacing(2),
}));

export const RequestErrorMessage = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.error.main,
    textAlign: "center",
}));
