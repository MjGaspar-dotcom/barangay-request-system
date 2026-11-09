import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#2F7D4A",
            dark: "#27683D",
            light: "#DCEBDD",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#647067",
            dark: "#25352B",
            light: "#F5F7F5",
            contrastText: "#ffffff",
        },
        success: {
            main: "#218653",
            dark: "#17633C",
            light: "#E5F2E9",
        },
        error: {
            main: "#C24141",
            dark: "#9C3030",
            light: "#FAE8E8",
        },
        warning: {
            main: "#B7791F",
            dark: "#805411",
            light: "#FBF1DF",
        },
        info: {
            main: "#356AC3",
            dark: "#2B559A",
            light: "#E9EFFA",
        },
        background: {
            default: "#F5F7F5",
            paper: "#ffffff",
        },
        text: {
            primary: "#25352B",
            secondary: "#647067",
        },
        divider: "#E1E7E2",
    },

    typography: {
        fontFamily:
            '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        h1: {
            fontSize: "1.875rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
        },
        h2: {
            fontSize: "1.5rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
        },
        h3: {
            fontSize: "1.25rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
        },
        h4: {
            fontSize: "1.0625rem",
            fontWeight: 600,
        },
        body1: {
            fontSize: "0.9375rem",
            lineHeight: 1.65,
        },
        body2: {
            fontSize: "0.875rem",
            lineHeight: 1.6,
        },
        button: {
            fontWeight: 600,
            textTransform: "none",
        },
        validationError: {
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.45,
        },
    },

    spacing: 8,

    breakpoints: {
        values: {
            xs: 0,
            sm: 480,
            md: 768,
            lg: 1024,
            xl: 1280,
        },
    },

    shape: {
        borderRadius: 10,
    },

    customColors: {
        heading: "#25352B",
        surface: "#F5F7F5",
        surfaceStrong: "#EEF2EE",
        paleGreen: "#DCEBDD",
        mutedGreen: "#C6DDC8",
        borderSoft: "#E1E7E2",
        focusRing: "rgba(47, 125, 74, 0.2)",

        portal: {
            background: "#25352B",
            backgroundDeep: "#1C2921",
            headerSurface: "#2F7D4A",
            headerBorder: "#559563",
            footerSurface: "#25352B",
            primaryText: "#ffffff",
            secondaryText: "#E1E7E2",
            mutedText: "#C6DDC8",
            accent: "#DCEBDD",
            logoBackground: "#2F7D4A",
            logoBorder: "#DCEBDD",
            iconSurface: "rgba(255, 255, 255, 0.1)",
            cardDecoration: "rgba(255, 255, 255, 0.08)",
            texture: "rgba(255, 255, 255, 0.035)",

            serviceCards: {
                request: "#2F7D4A",
                track: "#218653",
                signIn: "#27683D",
                register: "#559563",
            },
        },
    },

    formValidation: {
        errorMessage: {
            iconSize: 16,
            iconOffset: 1,
            gap: 6,
            marginTop: 6,
            entranceOffset: 2,
            transitionDuration: 160,
        },
    },

    statusColors: {
        pending: {
            background: "#FBF1DF",
            color: "#805411",
        },
        approved: {
            background: "#DCEBDD",
            color: "#25352B",
        },
        processing: {
            background: "#E9EFFA",
            color: "#2B559A",
        },
        ready: {
            background: "#E5F2E9",
            color: "#17633C",
        },
        completed: {
            background: "#E5F2E9",
            color: "#17633C",
        },
        rejected: {
            background: "#FAE8E8",
            color: "#9C3030",
        },
        neutral: {
            background: "#EEF2EE",
            color: "#48534B",
        },
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    scrollBehavior: "smooth",
                },
                body: {
                    margin: 0,
                    backgroundColor: "#F5F7F5",
                    color: "#25352B",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                },
                "#root": {
                    minHeight: "100vh",
                },
                a: {
                    color: "inherit",
                    textDecoration: "none",
                },
                "*": {
                    boxSizing: "border-box",
                },
                "*:focus-visible": {
                    outline: "3px solid rgba(47, 125, 74, 0.24)",
                    outlineOffset: 2,
                },
            },
        },

        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    minHeight: 44,
                    padding: "9px 18px",
                    borderRadius: 10,
                    textTransform: "none",
                    fontWeight: 700,
                    letterSpacing: 0,
                    transition:
                        "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",

                    "&:hover": {
                        transform: "translateY(-1px)",
                    },

                    "&:active": {
                        transform: "translateY(0)",
                    },

                    "& .MuiCircularProgress-root": {
                        marginRight: 8,
                    },
                },
                containedPrimary: {
                    boxShadow: "0 2px 6px rgba(37, 53, 43, 0.08)",

                    "&:hover": {
                        boxShadow: "0 3px 8px rgba(37, 53, 43, 0.12)",
                    },
                },
                outlinedPrimary: {
                    borderColor: "rgba(47, 125, 74, 0.45)",
                },
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
                rounded: {
                    borderRadius: 10,
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    border: "1px solid #E1E7E2",
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(37, 53, 43, 0.05)",
                },
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme }) => ({
                    minHeight: 48,
                    borderRadius: 10,
                    backgroundColor: theme.palette.background.paper,
                    transition:
                        "box-shadow 0.18s ease, background-color 0.18s ease",

                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.divider,
                    },

                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.grey[400],
                    },

                    "&.Mui-focused": {
                        boxShadow: `0 0 0 3px ${theme.customColors.focusRing}`,
                    },

                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 1.5,
                    },

                    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.error.main,
                    },

                    "&.Mui-error:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.error.dark,
                    },

                    "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.error.main,
                        borderWidth: 1.5,
                    },
                }),
            },
        },

        MuiInputLabel: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.text.secondary,

                    "&.Mui-focused": {
                        color: theme.palette.primary.main,
                    },

                    "&.Mui-error": {
                        color: theme.palette.error.dark,
                    },
                }),
            },
        },

        MuiTextField: {
            defaultProps: {
                variant: "outlined",
                size: "medium",
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    alignItems: "center",
                },
                standardSuccess: {
                    border: "1px solid rgba(22, 163, 74, 0.2)",
                },
                standardError: {
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                },
                standardWarning: {
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                },
                standardInfo: {
                    border: "1px solid rgba(21, 128, 61, 0.2)",
                },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 700,
                },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 800,
                    color: "#48534B",
                    backgroundColor: "#EEF2EE",
                },
                root: {
                    borderBottomColor: "#E1E7E2",
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 8,
                    fontSize: "0.75rem",
                },
            },
        },
    },
});

export default theme;
