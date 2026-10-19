import { Card, CardContent } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

export const StatCardRoot = styled(Card)(({ theme }) => ({
    height: "100%",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 8px 20px rgba(20, 83, 45, 0.05)",
}));

export const StatCardContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(2.25),

    "&:last-child": {
        paddingBottom: theme.spacing(2.25),
    },
}));

export const StatCardHeader = styled("div")({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
});

export const StatCardLabel = styled("span")(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
}));

export const StatCardIcon = styled("span")(({ theme }) => ({
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,

    "& svg": {
        fontSize: 19,
    },
}));

export const StatCardValue = styled("strong")(({ theme }) => ({
    display: "block",
    marginTop: theme.spacing(1.5),
    color: theme.customColors.heading,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1,
}));

export const StatCardDescription = styled("p")(({ theme }) => ({
    margin: `${theme.spacing(1)} 0 0`,
    color: theme.palette.text.secondary,
    fontSize: 12,
    lineHeight: 1.5,
}));
