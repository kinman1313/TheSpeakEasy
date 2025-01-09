import { createTheme } from '@mui/material';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#7C4DFF', // Modern purple
            light: '#B47CFF',
            dark: '#5C35CC'
        },
        secondary: {
            main: '#00E5FF', // Bright cyan
            light: '#6EFFFF',
            dark: '#00B2CC'
        },
        background: {
            default: '#0A1929', // Deep blue-black
            paper: '#132F4C', // Lighter blue-black
            gradient: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(10,25,41,0.9) 100%)'
        },
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)'
        }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'linear-gradient(145deg, rgba(19,47,76,0.9) 0%, rgba(10,25,41,0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(19, 47, 76, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600
                },
                contained: {
                    background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
                    boxShadow: '0 3px 15px 2px rgba(124, 77, 255, 0.3)',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #B47CFF 30%, #6EFFFF 90%)',
                        boxShadow: '0 3px 20px 2px rgba(124, 77, 255, 0.4)'
                    }
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            transition: 'all 0.2s'
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.25)'
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#7C4DFF'
                        }
                    }
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: 'rgba(19, 47, 76, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                }
            }
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    margin: '4px 0',
                    '&:hover': {
                        background: 'rgba(124, 77, 255, 0.1)'
                    }
                }
            }
        }
    },
    shape: {
        borderRadius: 12
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700
        },
        h5: {
            fontWeight: 600
        },
        h6: {
            fontWeight: 600
        }
    }
}); 