import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import Register from '../components/Register';
import Chat from '../components/Chat';
import ResetPassword from '../components/ResetPassword';
import NewPassword from '../components/NewPassword';

// Protected Route Component
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects to chat if already logged in)
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/chat" />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <Register />
                </PublicRoute>
            } />
            <Route path="/reset-password" element={
                <PublicRoute>
                    <ResetPassword />
                </PublicRoute>
            } />
            <Route path="/reset-password/:token" element={<NewPassword />} />
            <Route path="/chat" element={
                <PrivateRoute>
                    <Chat />
                </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
    );
};

export default AppRoutes; 