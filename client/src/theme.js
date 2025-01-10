import { alpha } from '@mui/material/styles';

const baseTheme = {
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 600,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    mixins: {
        toolbar: {
            minHeight: 64,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#7C4DFF',
            light: '#B47CFF',
            dark: '#3F1DCB',
        },
        secondary: {
            main: '#FF4081',
            light: '#FF79B0',
            dark: '#C60055',
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1A1A',
            secondary: '#666666',
        },
        divider: '#E0E0E0',
        action: {
            hover: alpha('#7C4DFF', 0.04),
            selected: alpha('#7C4DFF', 0.08),
            disabled: alpha('#1A1A1A', 0.26),
            disabledBackground: alpha('#1A1A1A', 0.12),
        },
    },
};

const darkTheme = {
    ...baseTheme,
    palette: {
        ...baseTheme.palette,
        mode: 'dark',
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
        },
        divider: '#2D2D2D',
        action: {
            hover: alpha('#7C4DFF', 0.08),
            selected: alpha('#7C4DFF', 0.16),
            disabled: alpha('#FFFFFF', 0.3),
            disabledBackground: alpha('#FFFFFF', 0.12),
        },
    },
};

export default baseTheme; 