import { FormControlLabel, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

export const RequestFormRoot = styled("form")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
}));

export const FormSection = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 6px 18px rgba(20, 83, 45, 0.035)",

    [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const FormSectionHeader = styled("div")(({ theme }) => ({
    paddingBottom: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const FormSectionTitle = styled("h2")(({ theme }) => ({
    margin: 0,
    color: theme.palette.primary.dark,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,

    [theme.breakpoints.down("sm")]: {
        fontSize: 16,
    },
}));

export const FormSectionDescription = styled("p")(({ theme }) => ({
    maxWidth: 700,
    margin: `${theme.spacing(0.75)} 0 0`,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.6,

    [theme.breakpoints.down("sm")]: {
        fontSize: 12,
    },
}));

export const FormGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(2.5),

    [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const FormField = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
});

export const MiddleNameOption = styled(FormControlLabel)(({ theme }) => ({
    width: "fit-content",
    marginTop: theme.spacing(0.5),
    marginLeft: 0,
    marginRight: 0,
    color: theme.palette.text.secondary,

    "& .MuiFormControlLabel-label": {
        fontSize: theme.typography.validationError.fontSize,
        lineHeight: theme.typography.validationError.lineHeight,
    },

    "& .MuiCheckbox-root": {
        padding: theme.spacing(0.75),
        marginRight: theme.spacing(0.5),
    },
}));

export const RequestFormLoading = styled("div")(({ theme }) => ({
    padding: theme.spacing(3),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1.5),
    color: theme.palette.text.secondary,
}));

export const RequestSuccessMessage = styled("div")(({ theme }) => ({
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.success.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
}));

export const TrackingMessage = styled("p")({
    margin: "0 0 4px",
});

export const TrackingNumber = styled("span")({
    fontFamily: "ui-monospace, Consolas, monospace",
});

export const TrackingNote = styled("small")(({ theme }) => ({
    display: "block",
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
}));

export const ValidIdPreview = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.customColors.surface,
}));

export const ValidIdPreviewLabel = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 13,
    fontWeight: 600,
}));

export const ValidIdPreviewImage = styled("img")(({ theme }) => ({
    width: "100%",
    maxHeight: 320,
    display: "block",
    objectFit: "contain",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
}));

export const IdCameraActions = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(1.5),
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1),
}));

export const IdCameraPanel = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.25),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.customColors.surface,
}));

export const IdCameraVideo = styled("video")(({ theme }) => ({
    width: "100%",
    maxHeight: 420,
    display: "block",
    objectFit: "contain",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.black,
}));

export const IdCameraNote = styled("p")(({ theme }) => ({
    margin: 0,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const IdVerificationActions = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(1.25),
}));

export const IdVerificationPendingMessage = styled("div")(({ theme }) => ({
    width: "100%",
    padding: theme.spacing(1.25),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const IdVerificationSuccessMessage = styled("div")(({ theme }) => ({
    width: "100%",
    padding: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    border: `1px solid ${theme.palette.success.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    fontSize: 13,
    lineHeight: 1.5,
}));

export const IdVerificationFailureMessage = styled("div")(({ theme }) => ({
    width: "100%",
    padding: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    border: `1px solid ${theme.palette.error.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    fontSize: 13,
    lineHeight: 1.5,
}));
