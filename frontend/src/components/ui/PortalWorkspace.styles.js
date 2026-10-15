import { Paper } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

export const PortalWorkspaceRoot = styled(Paper)(({ theme }) => ({
    width: "100%",
    padding: theme.spacing(3.5),
    border: `1px solid ${alpha(theme.palette.common.white, 0.78)}`,
    borderRadius: 24,
    backgroundColor: alpha(theme.palette.background.paper, 0.96),
    boxShadow: "0 24px 60px rgba(1, 31, 24, 0.18)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",

    [theme.breakpoints.down("md")]: {
        padding: theme.spacing(3),
        borderRadius: 20,
    },

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
        borderRadius: 16,
    },
}));
