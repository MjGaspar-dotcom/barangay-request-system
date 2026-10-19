import { styled } from "@mui/material/styles";

export const AdminPortal = styled("section")({
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
});

export const AdminOverviewGrid = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },

    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const AdminManagementGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const AdminBottomGrid = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: "grid",
    gridTemplateColumns: "1.25fr 0.75fr",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const AdminAnalyticsContent = styled("div")(({ theme }) => ({
    minHeight: 190,
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    color: theme.palette.primary.main,
    textAlign: "center",

    "& > svg": {
        marginBottom: theme.spacing(0.75),
        fontSize: 28,
    },

    "& p": {
        maxWidth: 300,
        margin: `${theme.spacing(1)} 0 ${theme.spacing(1.5)}`,
        color: theme.palette.text.secondary,
        fontSize: 13,
        lineHeight: 1.55,
    },
}));

export const AdminAnalyticsValue = styled("div")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1,
}));

export const AdminAnalyticsNote = styled("span")(({ theme }) => ({
    padding: "6px 10px",
    borderRadius: 999,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.7,
    textTransform: "uppercase",
}));
