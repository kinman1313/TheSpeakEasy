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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Login attempt:', { email, apiUrl: config.API_URL });

        try {
            const user = await login(email, password);
            console.log('Login successful:', user);
            navigate('/chat');
        } catch (err) {
            console.error('Login error:', err);
            if (err.message === 'Network Error') {
                setError('Unable to connect to server. Please check your connection.');
            } else if (err.response?.status === 401) {
                setError('Invalid email or password');
            } else if (err.message.includes('timeout')) {
                setError('Request timed out. Please try again.');
            } else {
                setError(err.message || 'An error occurred during login');
            }
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
                        <Alert severity="error" sx={{ mb: 2 }}>
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
                        />

                        <LoadingButton
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            loading={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
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