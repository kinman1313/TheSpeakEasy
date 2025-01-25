import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import AppRoutes from './routes/AppRoutes';
import { CssBaseline } from '@mui/material';

// Wrap all providers into a single component
const Providers = ({ children }) => (
    <AuthProvider>
        <SocketProvider>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </SocketProvider>
    </AuthProvider>
);

// ThemedApp component to apply the theme
const ThemedApp = () => {
    const { theme } = useTheme();

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Providers>
                    <AppRoutes />
                </Providers>
            </Router>
        </MuiThemeProvider>
    );
};

// Main App component
function App() {
    return (
        <ThemeProvider>
            <ThemedApp />
        </ThemeProvider>
    );
}

export default App;