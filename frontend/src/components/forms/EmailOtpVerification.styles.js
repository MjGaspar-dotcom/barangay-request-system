import { styled } from "@mui/material/styles";

export const EmailOtpRoot = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));

export const EmailOtpDescription = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 12,
    lineHeight: 1.5,
}));

export const EmailOtpActions = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: theme.spacing(1),

    "& > .MuiButton-root:first-of-type": {
        gridColumn: "1 / -1",
        justifySelf: "start",
    },

    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",

        "& > .MuiButton-root": {
            width: "100%",
        },
    },
}));

export const EmailOtpStatus = styled("div")(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: 12,
    lineHeight: 1.5,
}));

export const EmailOtpVerified = styled("div")(({ theme }) => ({
    padding: theme.spacing(1.25),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.25),
    border: `1px solid ${theme.palette.success.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    fontSize: 12,
    lineHeight: 1.5,
}));

export const EmailOtpError = styled("div")(({ theme }) => ({
    color: theme.palette.error.dark,
    fontSize: theme.typography.validationError.fontSize,
    fontWeight: theme.typography.validationError.fontWeight,
    lineHeight: theme.typography.validationError.lineHeight,
}));
