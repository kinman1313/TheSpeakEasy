import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const baseTheme = {
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
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                }
            }
        }
    }
};

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'system';
    });

    const [systemTheme, setSystemTheme] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const currentTheme = createTheme({
        ...baseTheme,
        palette: {
            ...baseTheme.palette,
            mode: mode === 'system' ? systemTheme : mode,
            ...(mode === 'system' ?
                (systemTheme === 'dark' ? {
                    background: {
                        default: '#121212',
                        paper: '#1E1E1E',
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#B0B0B0',
                    },
                } : {}) :
                (mode === 'dark' ? {
                    background: {
                        default: '#121212',
                        paper: '#1E1E1E',
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#B0B0B0',
                    },
                } : {}))
        },
    });

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
    };

    const value = {
        mode,
        setMode,
        toggleTheme,
        theme: currentTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext; 