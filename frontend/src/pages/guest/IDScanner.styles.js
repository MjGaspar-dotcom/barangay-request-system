import { Button, IconButton } from "@mui/material";
import {
    alpha,
    styled,
} from "@mui/material/styles";

export const ScannerRoot = styled("main")(({ theme }) => ({
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
}));

export const ScannerHeader = styled("header")(({ theme }) => ({
    minHeight: 68,
    padding: `${theme.spacing(1.25)} ${theme.spacing(2)}`,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
    backgroundColor: alpha(theme.palette.common.black, 0.94),
}));

export const ScannerBackButton = styled(IconButton)(({ theme }) => ({
    flexShrink: 0,
    color: theme.palette.common.white,

    "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.1),
    },
}));

export const ScannerHeaderCopy = styled("div")({
    minWidth: 0,
    display: "flex",
    flexDirection: "column",

    "& span": {
        opacity: 0.7,
        fontSize: 12,
        lineHeight: 1.4,
    },
});

export const ScannerHeaderTitle = styled("h1")({
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
});

export const ScannerContent = styled("div")(({ theme }) => ({
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
    padding: `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(4)}`,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2.25),

    [theme.breakpoints.down("sm")]: {
        paddingTop: theme.spacing(2.25),
        paddingBottom: theme.spacing(3),
    },
}));

export const ScannerInstruction = styled("p")(({ theme }) => ({
    maxWidth: 620,
    margin: 0,
    color: alpha(theme.palette.common.white, 0.88),
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: "center",
}));

export const ScannerViewport = styled("div")(({ theme }) => ({
    width: "100%",
    maxWidth: 620,
    aspectRatio: "1.586 / 1",
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: theme.palette.grey[900],
    boxShadow: `0 0 0 1px ${alpha(theme.palette.common.white, 0.16)}`,

    [theme.breakpoints.down("sm")]: {
        borderRadius: 14,
    },
}));

export const ScannerCameraVideo = styled("video")({
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
});

export const ScannerReviewImage = styled("img")({
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "contain",
});

export const ScannerFrame = styled("div")(({ theme }) => ({
    position: "absolute",
    inset: theme.spacing(1.25),
    border: `1px solid ${alpha(theme.palette.common.white, 0.42)}`,
    borderRadius: 14,
    pointerEvents: "none",
}));

export const ScannerFrameCorners = styled("div")(({ theme }) => ({
    position: "absolute",
    inset: -1,

    "& span": {
        width: 34,
        height: 34,
        position: "absolute",
        borderColor: theme.palette.common.white,
        borderStyle: "solid",
        borderWidth: 0,
    },

    "& span:nth-of-type(1)": {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },

    "& span:nth-of-type(2)": {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },

    "& span:nth-of-type(3)": {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },

    "& span:nth-of-type(4)": {
        right: 0,
        bottom: 0,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderBottomRightRadius: 12,
    },
}));

export const ScannerScanLine = styled("span")(({ theme }) => ({
    width: "calc(100% - 24px)",
    height: 2,
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    backgroundColor: theme.palette.success.main,
    boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.9)}`,
    animation: "idScannerLine 2.2s ease-in-out infinite",

    "@keyframes idScannerLine": {
        "0%": {
            top: 12,
            opacity: 0.4,
        },

        "50%": {
            opacity: 1,
        },

        "100%": {
            top: "calc(100% - 14px)",
            opacity: 0.4,
        },
    },

    "@media (prefers-reduced-motion: reduce)": {
        animation: "none",
        top: "50%",
    },
}));

export const ScannerLoading = styled("div")(({ theme }) => ({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1.25),
    backgroundColor: alpha(theme.palette.common.black, 0.58),
    color: theme.palette.common.white,
    fontSize: 13,
}));

export const ScannerStatus = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    color: alpha(theme.palette.common.white, 0.8),
    fontSize: 13,
    textAlign: "center",
}));

export const ScannerStatusDot = styled("span")(({ theme }) => ({
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: "50%",
    backgroundColor: theme.palette.success.main,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0.16)}`,
}));

export const ScannerError = styled("div")(({ theme }) => ({
    width: "100%",
    maxWidth: 620,
    padding: theme.spacing(1.5),
    border: `1px solid ${alpha(theme.palette.error.light, 0.5)}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.error.dark, 0.32),
    color: theme.palette.error.light,
    fontSize: 13,
    lineHeight: 1.55,
    textAlign: "center",
}));

export const ScannerTips = styled("div")(({ theme }) => ({
    width: "100%",
    maxWidth: 620,
    padding: theme.spacing(1.75),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.5),
    border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.06),
    color: alpha(theme.palette.common.white, 0.72),
    fontSize: 12,
    lineHeight: 1.55,

    "& strong": {
        marginBottom: theme.spacing(0.25),
        color: theme.palette.common.white,
        fontSize: 13,
    },
}));

export const ScannerActions = styled("div")(({ theme }) => ({
    width: "100%",
    maxWidth: 620,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1.25),

    "& > :only-child": {
        gridColumn: "1 / -1",
    },

    [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
    },
}));

export const ScannerActionButton = styled(Button)(({ theme }) => ({
    minHeight: 48,
    borderRadius: 10,
    fontWeight: 700,

    "&.MuiButton-contained": {
        backgroundColor: theme.palette.primary.main,

        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
        },
    },

    "&.MuiButton-outlined": {
        borderColor: alpha(theme.palette.common.white, 0.38),
        color: theme.palette.common.white,

        "&:hover": {
            borderColor: theme.palette.common.white,
            backgroundColor: alpha(theme.palette.common.white, 0.08),
        },
    },
}));
