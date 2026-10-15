import { styled } from "@mui/material/styles";
import { SectionRoot } from "./Section.styles";

export const RoleSectionRoot = styled(SectionRoot)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));

export const RoleGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 24,

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));
