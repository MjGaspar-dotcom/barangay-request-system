import { Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const alignItemsByValue = {
    left: "flex-start",
    center: "center",
};

export const PageHeaderRoot = styled(Stack, {
    shouldForwardProp: (prop) => prop !== "align",
})(({ theme, align }) => ({
    marginBottom: theme.spacing(3),
    flexDirection: "row",
    alignItems: align === "center" ? "center" : "flex-end",
    justifyContent: align === "center" ? "center" : "space-between",
    gap: theme.spacing(2.5),
    textAlign: align === "center" ? "center" : "left",

    [theme.breakpoints.down("md")]: {
        alignItems: align === "center" ? "center" : "flex-start",
        flexDirection: "column",
    },
}));

export const PageHeaderCopy = styled(Stack, {
    shouldForwardProp: (prop) => prop !== "align",
})(({ theme, align }) => ({
    maxWidth: 720,
    alignItems: alignItemsByValue[align] || "flex-start",
    gap: theme.spacing(0.75),
}));

export const PageHeaderEyebrow = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.main,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.35,
    lineHeight: 1.4,
    textTransform: "uppercase",
}));

export const PageHeaderTitle = styled(Typography)(({ theme }) => ({
    margin: 0,
    color: theme.customColors.heading,
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 800,
    letterSpacing: "-0.035em",
    lineHeight: 1.08,

    "& strong": {
        color: theme.palette.primary.main,
        fontWeight: "inherit",
    },

    [theme.breakpoints.down("sm")]: {
        fontSize: 28,
    },
}));


export const PageHeaderDescription = styled(Typography)(({ theme }) => ({
    maxWidth: 640,
    color: theme.palette.text.secondary,
    fontSize: 14,
    lineHeight: 1.65,
}));


export const PageHeaderAction = styled("div")({
    flex: "0 0 auto",
});
