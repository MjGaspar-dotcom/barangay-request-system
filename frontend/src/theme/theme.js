import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#166534",
            dark: "#14532d",
            light: "#dcfce7",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#64748b",
            dark: "#334155",
            light: "#f1f5f9",
            contrastText: "#ffffff",
        },
        success: {
            main: "#16a34a",
            dark: "#15803d",
            light: "#dcfce7",
        },
        error: {
            main: "#dc2626",
            dark: "#991b1b",
            light: "#fee2e2",
        },
        warning: {
            main: "#d97706",
            dark: "#92400e",
            light: "#fef3c7",
        },
        info: {
            main: "#2563eb",
            dark: "#1e40af",
            light: "#dbeafe",
        },
        background: {
            default: "#f6f8f7",
            paper: "#ffffff",
        },
        text: {
            primary: "#17201b",
            secondary: "#64748b",
        },
        divider: "#e2e8e5",
    },

    typography: {
        fontFamily:
            '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        h1: {
            fontWeight: 800,
            letterSpacing: "-0.03em",
        },
        h2: {
            fontWeight: 800,
            letterSpacing: "-0.02em",
        },
        h3: {
            fontWeight: 700,
            letterSpacing: "-0.01em",
        },
        h4: {
            fontWeight: 700,
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
            fontWeight: 700,
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
        borderRadius: 12,
    },

    customColors: {
        heading: "#17201b",
        surface: "#f8faf9",
        surfaceStrong: "#f1f5f3",
        paleGreen: "#f0fdf4",
        mutedGreen: "#bbf7d0",
        borderSoft: "#e7ece9",
        focusRing: "rgba(22, 101, 52, 0.18)",

        portal: {
            background: "#062f25",
            backgroundDeep: "#03271f",
            headerSurface: "#174c3b",
            headerBorder: "#2f6853",
            footerSurface: "#123c30",
            primaryText: "#ffffff",
            secondaryText: "#d4e2dc",
            mutedText: "#b3c9c0",
            accent: "#e6c45b",
            logoBackground: "#166534",
            logoBorder: "#e6c45b",
            iconSurface: "rgba(255, 255, 255, 0.1)",
            cardDecoration: "rgba(255, 255, 255, 0.08)",
            texture: "rgba(255, 255, 255, 0.035)",

            serviceCards: {
                request: "#166534",
                track: "#0f766e",
                signIn: "#245f4b",
                register: "#416b55",
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
            background: "#fef3c7",
            color: "#92400e",
        },
        approved: {
            background: "#dbeafe",
            color: "#1e40af",
        },
        processing: {
            background: "#ede9fe",
            color: "#6d28d9",
        },
        ready: {
            background: "#d1fae5",
            color: "#065f46",
        },
        completed: {
            background: "#dcfce7",
            color: "#166534",
        },
        rejected: {
            background: "#fee2e2",
            color: "#991b1b",
        },
        neutral: {
            background: "#e5e7eb",
            color: "#374151",
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
                    backgroundColor: "#f6f8f7",
                    color: "#17201b",
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
                    outline: "3px solid rgba(22, 101, 52, 0.2)",
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
                    boxShadow: "0 4px 12px rgba(22, 101, 52, 0.18)",

                    "&:hover": {
                        boxShadow: "0 6px 16px rgba(22, 101, 52, 0.22)",
                    },
                },
                outlinedPrimary: {
                    borderColor: "rgba(22, 101, 52, 0.35)",
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
                    borderRadius: 14,
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    border: "1px solid #e7ece9",
                    borderRadius: 16,
                    boxShadow: "0 8px 24px rgba(20, 83, 45, 0.06)",
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
                    border: "1px solid rgba(37, 99, 235, 0.2)",
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
                    color: "#475569",
                    backgroundColor: "#f8faf9",
                },
                root: {
                    borderBottomColor: "#e7ece9",
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
