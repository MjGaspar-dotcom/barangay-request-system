import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { FormHelperText } from "@mui/material";
import { styled } from "@mui/material/styles";

export const FieldValidationErrorRoot = styled(FormHelperText)(({ theme }) => ({
    margin: `${theme.formValidation.errorMessage.marginTop}px 2px 0`,
    display: "flex",
    alignItems: "flex-start",
    gap: theme.formValidation.errorMessage.gap,
    color: theme.palette.error.dark,
    fontSize: theme.typography.validationError.fontSize,
    fontWeight: theme.typography.validationError.fontWeight,
    lineHeight: theme.typography.validationError.lineHeight,
    letterSpacing: "0.01em",
    animation: `fieldValidationErrorEnter ${theme.formValidation.errorMessage.transitionDuration}ms ${theme.transitions.easing.easeOut}`,

    "& span": {
        minWidth: 0,
        display: "block",
    },

    "@keyframes fieldValidationErrorEnter": {
        from: {
            opacity: 0,
            transform: `translateY(-${theme.formValidation.errorMessage.entranceOffset}px)`,
        },

        to: {
            opacity: 1,
            transform: "translateY(0)",
        },
    },

    "@media (prefers-reduced-motion: reduce)": {
        animation: "none",
    },
}));

export const FieldValidationErrorIcon = styled(ErrorOutlineRoundedIcon)(
    ({ theme }) => ({
        width: theme.formValidation.errorMessage.iconSize,
        height: theme.formValidation.errorMessage.iconSize,
        marginTop: theme.formValidation.errorMessage.iconOffset,
        flexShrink: 0,
    }),
);
