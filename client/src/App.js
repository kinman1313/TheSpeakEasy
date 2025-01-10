import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import AppRoutes from './routes/AppRoutes';
import { CssBaseline } from '@mui/material';
import { useTheme } from './contexts/ThemeContext';

const ThemedApp = () => {
    const { theme } = useTheme();

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <SocketProvider>
                        <NotificationProvider>
                            <AppRoutes />
                        </NotificationProvider>
                    </SocketProvider>
                </AuthProvider>
            </Router>
        </MuiThemeProvider>
    );
};

function App() {
    return (
        <CustomThemeProvider>
            <ThemedApp />
        </CustomThemeProvider>
    );
}

export default App; 