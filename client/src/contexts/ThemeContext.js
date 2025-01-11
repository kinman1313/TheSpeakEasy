import React, { createContext, useContext, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState('dark');

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: '#3B82F6',
                light: '#60A5FA',
                dark: '#2563EB',
                contrastText: '#FFFFFF'
            },
            background: {
                default: '#0A0F1E',
                paper: 'rgba(15, 23, 42, 0.65)'
            },
            text: {
                primary: '#F1F5F9',
                secondary: '#94A3B8'
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h6: {
                fontWeight: 600,
                letterSpacing: '0.0075em'
            }
        },
        shape: {
            borderRadius: 16
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: 'rgba(255, 255, 255, 0.1) rgba(0, 0, 0, 0.1)',
                        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                            background: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.2)'
                            }
                        }
                    }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }
                }
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.25)'
                    }
                }
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.25)'
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out'
                    }
                }
            },
            MuiListItem: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        }
    });

    return (
        <ThemeContext.Provider value={{ mode, setMode, theme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext; 