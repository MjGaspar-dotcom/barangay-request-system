import { Card, CardContent } from "@mui/material";
import { styled } from "@mui/material/styles";

export const SectionCardRoot = styled(Card)(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 18,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 10px 28px rgba(20, 83, 45, 0.055)",
}));

export const SectionCardHeader = styled("div")(({ theme }) => ({
    padding: `${theme.spacing(2.25)} ${theme.spacing(2.5)}`,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const SectionCardHeaderCopy = styled("div")({
    minWidth: 0,
});

export const SectionCardEyebrow = styled("span")(({ theme }) => ({
    display: "block",
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
}));

export const SectionCardTitle = styled("h2")(({ theme }) => ({
    margin: `${theme.spacing(0.5)} 0 0`,
    color: theme.customColors.heading,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
}));

export const SectionCardAction = styled("div")({
    flex: "0 0 auto",
});

export const SectionCardBody = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(2.5),

    "&:last-child": {
        paddingBottom: theme.spacing(2.5),
    },

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),

        "&:last-child": {
            paddingBottom: theme.spacing(2),
        },
    },
}));
