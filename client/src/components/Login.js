import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Container,
    Paper,
    TextField,
    Typography,
    Link,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { config } from '../config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Login attempt:', { email, apiUrl: config.API_URL, retryCount });

        try {
            const user = await login(email, password);
            console.log('Login successful:', user);
            navigate('/chat');
        } catch (err) {
            console.error('Login error:', err);
            let errorMessage = err.message;

            if (err.message.includes('timeout') || err.message.includes('Network Error')) {
                if (retryCount < 2) {
                    setRetryCount(prev => prev + 1);
                    setError(`Connection issue. Retrying... (Attempt ${retryCount + 1}/2)`);
                    setTimeout(() => handleSubmit(e), 1000);
                    return;
                }
                errorMessage = 'Unable to connect to server. Please check your connection and try again.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Invalid email or password';
            } else if (err.response?.status === 429) {
                errorMessage = 'Too many login attempts. Please try again later.';
            }

            setError(errorMessage);
            setRetryCount(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Login
                    </Typography>

                    {error && (
                        <Alert
                            severity={error.includes('Retrying') ? 'info' : 'error'}
                            sx={{ mb: 2 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                            error={!!error && !error.includes('Retrying')}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={loading}
                            error={!!error && !error.includes('Retrying')}
                        />

                        <LoadingButton
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            loading={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? (
                                error?.includes('Retrying') ? 'Retrying...' : 'Logging in...'
                            ) : (
                                'Login'
                            )}
                        </LoadingButton>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link component={RouterLink} to="/register" variant="body2">
                                {"Don't have an account? Sign Up"}
                            </Link>
                            <Link component={RouterLink} to="/reset-password" variant="body2">
                                {"Forgot Password?"}
                            </Link>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
} 