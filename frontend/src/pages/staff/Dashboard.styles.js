import { styled } from "@mui/material/styles";

export const StaffPortal = styled("section")({
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto",
});

export const StaffStatGrid = styled("div")(({ theme }) => ({
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

export const StaffWorkGrid = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: theme.spacing(1.5),

    [theme.breakpoints.down("lg")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const StaffWorkflow = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75),
}));

export const StaffWorkflowItem = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),

    "& strong": {
        display: "block",
        marginBottom: theme.spacing(0.4),
        color: theme.palette.primary.dark,
        fontSize: 14,
        fontWeight: 800,
    },

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
        fontSize: 13,
        lineHeight: 1.5,
    },
}));

export const StaffWorkflowNumber = styled("span")(({ theme }) => ({
    width: 30,
    height: 30,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    borderRadius: 9,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
}));

export const StaffWorkflowLine = styled("div")(({ theme }) => ({
    width: 1,
    height: 16,
    marginLeft: 14,
    backgroundColor: theme.palette.divider,
}));
