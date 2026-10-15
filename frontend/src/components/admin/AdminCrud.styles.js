import { alpha, styled } from "@mui/material/styles";
import {
    Paper,
    Table,
    TableCell,
    TableContainer,
    TableRow,
    TextField,
} from "@mui/material";

export const AdminPage = styled("div")({
    width: "100%",
});

export const AdminPageHeader = styled("header")(({ theme }) => ({
    marginBottom: theme.spacing(3),

    "& h1": {
        margin: "6px 0 8px",
        color: theme.customColors.heading,
        fontSize: 30,
        fontWeight: 800,
    },

    "& p": {
        maxWidth: 720,
        margin: 0,
        color: theme.palette.text.secondary,
        fontSize: 14,
        lineHeight: 1.6,
    },

    [theme.breakpoints.down("sm")]: {
        "& h1": {
            fontSize: 26,
        },
    },
}));

export const AdminPageLabel = styled("span")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
}));

export const AdminMessages = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));

export const AdminSection = styled(Paper)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    backgroundImage: "none",
    boxShadow: "0 8px 24px rgba(20, 83, 45, 0.05)",

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const AdminFilterBar = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
}));

export const AdminSearchField = styled(TextField)(({ theme }) => ({
    flex: "1 1 280px",
    maxWidth: 360,

    [theme.breakpoints.down("md")]: {
        maxWidth: "none",
    },
}));

export const AdminFilterField = styled(TextField)(({ theme }) => ({
    flex: "0 1 200px",
    minWidth: 170,

    [theme.breakpoints.down("sm")]: {
        flex: "1 1 100%",
    },
}));

export const AdminResultsCount = styled("div")(({ theme }) => ({
    marginLeft: "auto",
    color: theme.palette.text.secondary,
    fontSize: 14,
    whiteSpace: "nowrap",

    [theme.breakpoints.down("md")]: {
        width: "100%",
        marginLeft: 0,
    },
}));

export const AdminTableWrapper = styled(TableContainer)(({ theme }) => ({
    overflowX: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
}));

export const AdminDataTable = styled(Table)({
    minWidth: 1100,
});

export const AdminTableHeaderCell = styled(TableCell)(({ theme }) => ({
    padding: "13px 14px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.customColors.surface,
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
}));

export const AdminActionHeaderCell = styled(AdminTableHeaderCell)({
    minWidth: 220,
});

export const AdminTableRow = styled(TableRow)(({ theme }) => ({
    transition: "background-color 0.15s ease",

    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.025),
    },

    "&:last-child td": {
        borderBottom: 0,
    },
}));

export const AdminTableDataCell = styled(TableCell)(({ theme }) => ({
    padding: "14px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    fontSize: 13,
    verticalAlign: "top",
}));

export const AdminTablePrimaryText = styled("strong")(({ theme }) => ({
    display: "block",
    color: theme.palette.text.primary,
    fontWeight: 700,
}));

export const AdminTableSecondaryText = styled("div")(({ theme }) => ({
    marginTop: 3,
    color: theme.palette.text.secondary,
    fontSize: 12,
}));

export const AdminMutedText = styled("span")(({ theme }) => ({
    color: theme.palette.grey[400],
    fontSize: 12,
}));

export const AdminRowActions = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.75),
}));

export const AdminEmptyState = styled("div")(({ theme }) => ({
    minHeight: 260,
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",

    "& h3": {
        margin: 0,
        color: theme.palette.text.primary,
        fontSize: 17,
        fontWeight: 700,
    },

    "& p": {
        maxWidth: 420,
        margin: "8px 0 0",
        color: theme.palette.text.secondary,
        fontSize: 14,
        lineHeight: 1.6,
    },
}));

export const AdminEmptyIcon = styled("div")(({ theme }) => ({
    width: 48,
    height: 48,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.customColors.paleGreen,
    fontSize: 22,
}));

export const AdminPageState = styled("div")(({ theme }) => ({
    minHeight: "50vh",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    gap: theme.spacing(1.5),

    "& p": {
        margin: 0,
        color: theme.palette.text.secondary,
    },
}));
