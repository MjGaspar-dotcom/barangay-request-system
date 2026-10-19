import { styled } from "@mui/material/styles";
import { FormControlLabel, Switch } from "@mui/material";
import {
    AdminActionHeaderCell,
    AdminTableDataCell,
} from "../../components/admin/AdminCrud.styles";

export const DocumentPageHeaderRow = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
}));

export const DocumentFormTitle = styled("h2")(({ theme }) => ({
    margin: "0 0 20px",
    color: theme.palette.primary.dark,
    fontSize: 20,
    fontWeight: 700,
}));

export const DocumentFormGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: theme.spacing(2),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const DocumentFormField = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
});

export const DocumentFullField = styled("div")({
    minWidth: 0,
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
});

export const DocumentStatusField = styled("div")(({ theme }) => ({
    minHeight: 56,
    display: "flex",
    alignItems: "center",

    [theme.breakpoints.down("md")]: {
        minHeight: 0,
    },
}));

export const DocumentStatusControl = styled(FormControlLabel)({
    marginLeft: 0,
});

export const DocumentStatusSwitch = styled(Switch)({});

export const DocumentFormActions = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(2.5),
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1.25),
}));

export const DocumentDescriptionCell = styled(AdminTableDataCell)({
    maxWidth: 320,
});

export const DocumentActionsHeaderCell = styled(AdminActionHeaderCell)({
    minWidth: 260,
});
