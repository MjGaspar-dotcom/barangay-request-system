import { styled } from "@mui/material/styles";

export const RoleCardRoot = styled("button")(({ theme }) => ({
    width: "100%",
    height: "100%",
    padding: 28,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    textAlign: "left",
    cursor: "pointer",
    transition:
        "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",

    "&:hover": {
        transform: "translateY(-4px)",
        borderColor: theme.palette.primary.main,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
    },
}));

export const RoleCardIcon = styled("div")(({ theme }) => ({
    width: 56,
    height: 56,
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.palette.primary.light,
    fontSize: 26,
}));

export const RoleCardTitle = styled("h3")(({ theme }) => ({
    margin: "0 0 8px",
    color: theme.palette.primary.main,
    fontSize: 20,
    fontWeight: 700,
}));

export const RoleCardDescription = styled("p")(({ theme }) => ({
    margin: "0 0 20px",
    color: theme.palette.text.secondary,
}));

export const RoleCardAction = styled("span")(({ theme }) => ({
    color: theme.palette.primary.main,
    fontWeight: 600,
}));
