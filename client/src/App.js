import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import AppRoutes from './routes/AppRoutes';
import { CssBaseline } from '@mui/material';

const Providers = ({ children }) => (
    <AuthProvider>
        <SocketProvider>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </SocketProvider>
    </AuthProvider>
);

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

function App() {
    return (
        <ThemeProvider>
            <ThemedApp />
        </ThemeProvider>
    );
}

<<<<<<< HEAD
export default App;






=======
export default App;
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
