import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Configure axios defaults
axios.defaults.timeout = 60000; // Increase timeout to 60 seconds
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for authentication
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Add timestamp to prevent caching
        config.params = {
            ...config.params,
            _t: Date.now()
        };
        return config;
    },
    error => Promise.reject(error)
);

// Add response interceptor for error handling
axios.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);

        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }

        if (!error.response) {
            throw new Error('Network error. Please check your connection and try again.');
        }

        if (error.response.status === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }

        // Handle specific error messages from the server
        const errorMessage = error.response?.data?.error || error.message;
        throw new Error(errorMessage);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/api/users/me`);
            setUser(response.data.user);
        } catch (error) {
            console.error('Auth check failed:', error.message);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('Attempting login to:', `${config.API_URL}/api/users/login`);

            // Add retry logic
            let retries = 2;
            let lastError;

            while (retries >= 0) {
                try {
                    const response = await axios.post(`${config.API_URL}/api/users/login`, {
                        email,
                        password
                    });

                    const { token, user } = response.data;
                    localStorage.setItem('token', token);
                    setUser(user);
                    return user;
                } catch (err) {
                    lastError = err;
                    if (err.response?.status === 401) {
                        // Don't retry on authentication errors
                        throw err;
                    }
                    retries--;
                    if (retries >= 0) {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        console.log('Retrying login attempt...');
                    }
                }
            }

            throw lastError;
        } catch (error) {
            console.error('Login failed:', error);
            if (error.response?.status === 401) {
                throw new Error('Invalid email or password');
            }
            throw error;
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${config.API_URL}/api/users/register`, {
                username,
                email,
                password
            });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        } catch (error) {
            console.error('Registration failed:', error);
            if (error.response?.status === 409) {
                throw new Error('Email already exists');
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 