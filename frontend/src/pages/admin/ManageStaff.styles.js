import { styled } from "@mui/material/styles";

export const StaffPageHeaderRow = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
}));

export const StaffFormTitle = styled("h2")(({ theme }) => ({
    margin: "0 0 20px",
    color: theme.palette.primary.dark,
    fontSize: 20,
    fontWeight: 700,
}));

export const StaffFormGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    gap: theme.spacing(2),
}));

export const StaffHalfField = styled("div")(({ theme }) => ({
    minWidth: 0,
    gridColumn: "span 6",
    display: "flex",
    flexDirection: "column",

    [theme.breakpoints.down("md")]: {
        gridColumn: "1 / -1",
    },
}));

export const StaffThirdField = styled("div")(({ theme }) => ({
    minWidth: 0,
    gridColumn: "span 4",
    display: "flex",
    flexDirection: "column",

    [theme.breakpoints.down("md")]: {
        gridColumn: "1 / -1",
    },
}));

export const StaffFullField = styled("div")({
    minWidth: 0,
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
});

export const StaffFormActions = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(2.5),
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1.25),
}));
