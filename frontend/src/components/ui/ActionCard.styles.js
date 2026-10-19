import { Card, CardActionArea } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

export const ActionCardSurface = styled(Card, {
    shouldForwardProp: (prop) => prop !== "emphasis",
})(({ theme, emphasis }) => ({
    minHeight: 116,
    border: `1px solid ${
        emphasis
            ? alpha(theme.palette.primary.main, 0.26)
            : theme.palette.divider
    }`,
    borderRadius: 16,
    backgroundColor: emphasis
        ? alpha(theme.palette.primary.light, 0.38)
        : theme.palette.background.paper,
    boxShadow: emphasis
        ? "0 10px 24px rgba(22, 101, 52, 0.08)"
        : "0 8px 20px rgba(20, 83, 45, 0.05)",
    transition:
        "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",

    "&:hover": {
        transform: "translateY(-2px)",
        borderColor: alpha(theme.palette.primary.main, 0.34),
        boxShadow: "0 14px 28px rgba(20, 83, 45, 0.1)",
    },

    [theme.breakpoints.down("sm")]: {
        minHeight: 104,
    },
}));

export const ActionCardRoot = styled(CardActionArea)(({ theme }) => ({
    minHeight: "inherit",
    padding: theme.spacing(2.25),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.75),
    color: theme.palette.text.primary,

    "& .MuiCardActionArea-focusHighlight": {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const ActionCardIcon = styled("div", {
    shouldForwardProp: (prop) => prop !== "emphasis",
})(({ theme, emphasis }) => ({
    width: 46,
    height: 46,
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: emphasis
        ? theme.palette.primary.main
        : theme.palette.primary.light,
    color: emphasis
        ? theme.palette.primary.contrastText
        : theme.palette.primary.main,

    "& svg": {
        fontSize: 24,
    },
}));

export const ActionCardContent = styled("div")(({ theme }) => ({
    minWidth: 0,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: theme.spacing(0.5),
}));

export const ActionCardTitle = styled("strong")(({ theme }) => ({
    color: theme.palette.primary.dark,
    fontSize: 15,
    fontWeight: 800,
}));

export const ActionCardDescription = styled("span")(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const ActionCardArrow = styled("span")(({ theme }) => ({
    flex: "0 0 auto",
    color: theme.palette.primary.main,

    "& svg": {
        display: "block",
        fontSize: 20,
    },
}));
