import { styled } from "@mui/material/styles";

export const EmptyStateRoot = styled("div")(({ theme }) => ({
    minHeight: 190,
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
}));

export const EmptyStateIcon = styled("div")(({ theme }) => ({
    width: 48,
    height: 48,
    marginBottom: theme.spacing(1.25),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,

    "& svg": {
        fontSize: 24,
    },
}));

export const EmptyStateTitle = styled("h3")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.primary,
    fontSize: 16,
    fontWeight: 800,
}));

export const EmptyStateDescription = styled("p")(({ theme }) => ({
    maxWidth: 420,
    margin: `${theme.spacing(0.75)} 0 0`,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.6,
}));

export const EmptyStateAction = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(2),
}));
