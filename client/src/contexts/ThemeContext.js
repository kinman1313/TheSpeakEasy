import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'dark';
    });

    const [messageColor, setMessageColor] = useState(() => {
        const savedColor = localStorage.getItem('messageColor');
        return savedColor || '#7C4DFF';
    });

    const [bubbleStyle, setBubbleStyle] = useState(() => {
        const savedStyle = localStorage.getItem('bubbleStyle');
        return savedStyle || 'modern';
    });

    const theme = createTheme({
        palette: {
            mode: themeMode,
            primary: {
                main: '#7C4DFF',
                light: '#B47CFF',
                dark: '#3F1DCF'
            },
            secondary: {
                main: '#FF4081',
                light: '#FF79B0',
                dark: '#C60055'
            },
            background: {
                default: themeMode === 'dark' ? '#121212' : '#F5F5F5',
                paper: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
                message: messageColor
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontWeight: 600
            },
            h2: {
                fontWeight: 600
            },
            h3: {
                fontWeight: 600
            }
        },
        shape: {
            borderRadius: 12
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                        padding: '8px 16px'
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none'
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none'
                    }
                }
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px'
                        },
                        '&::-webkit-scrollbar-track': {
                            background: themeMode === 'dark' ? '#1E1E1E' : '#F5F5F5'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: themeMode === 'dark' ? '#333333' : '#CCCCCC',
                            borderRadius: '4px',
                            '&:hover': {
                                background: themeMode === 'dark' ? '#444444' : '#BBBBBB'
                            }
                        }
                    }
                }
            }
        }
    });

    useEffect(() => {
        localStorage.setItem('themeMode', themeMode);
        localStorage.setItem('messageColor', messageColor);
        localStorage.setItem('bubbleStyle', bubbleStyle);
    }, [themeMode, messageColor, bubbleStyle]);

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        themeMode,
        setThemeMode,
        toggleTheme,
        messageColor,
        setMessageColor,
        bubbleStyle,
        setBubbleStyle
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext; 