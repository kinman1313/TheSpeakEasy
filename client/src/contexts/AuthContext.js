import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        if (!error.response) {
            throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
            const response = await axios.post(`${config.API_URL}/api/users/login`, {
                email,
                password
            });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (error) {
            console.error('Login failed:', error.message);
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
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (error) {
            console.error('Registration failed:', error.message);
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